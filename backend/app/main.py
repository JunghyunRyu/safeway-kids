import asyncio
import logging
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import async_session_factory
from app.logging_config import setup_logging
from app.rate_limit import limiter
from app.redis import redis_client

setup_logging(log_level=settings.log_level)

logger = logging.getLogger(__name__)


async def gps_flush_loop() -> None:
    """Background task: flush GPS buffers from Redis to PostgreSQL every 30s."""
    from app.modules.vehicle_telemetry.service import flush_gps_buffer

    while True:
        try:
            await asyncio.sleep(settings.gps_flush_interval_seconds)

            vehicle_ids = await redis_client.smembers("active_vehicles")
            if not vehicle_ids:
                continue

            async with async_session_factory() as db:
                total = 0
                inactive = []
                for vid_str in vehicle_ids:
                    vid = uuid.UUID(vid_str)
                    count = await flush_gps_buffer(redis_client, db, vid)
                    total += count

                    # If no GPS data in buffer and latest position expired, mark inactive
                    if count == 0:
                        latest = await redis_client.exists(f"vehicle:{vid}:gps")
                        if not latest:
                            inactive.append(vid_str)

                if total > 0:
                    await db.commit()
                    logger.info(
                        "GPS flush: %d records written for %d vehicles",
                        total, len(vehicle_ids),
                    )

                # Remove inactive vehicles from tracking set
                for vid_str in inactive:
                    await redis_client.srem("active_vehicles", vid_str)

        except asyncio.CancelledError:
            break
        except Exception:
            logger.exception("GPS flush error")


def _start_daily_cron() -> None:
    """Start APScheduler cron job for daily pipeline."""
    from datetime import date, timedelta

    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from apscheduler.triggers.cron import CronTrigger

    async def daily_pipeline_job() -> None:
        """Run daily pipeline for tomorrow's schedules."""
        from app.modules.compliance.service import deactivate_expired_documents
        from app.modules.scheduling.scheduler import run_daily_pipeline
        from app.modules.vehicle_telemetry.service import purge_old_gps_data, purge_old_location_access_logs

        tomorrow = date.today() + timedelta(days=1)
        logger.info("Cron: running daily pipeline for %s", tomorrow)
        try:
            async with async_session_factory() as db:
                # Deactivate expired compliance documents
                expired_count = await deactivate_expired_documents(db)
                if expired_count:
                    logger.info("Cron: deactivated %d expired compliance documents", expired_count)

                # Purge GPS data older than 180 days (위치정보법 제16조)
                purged = await purge_old_gps_data(db)
                if purged:
                    logger.info("Cron: purged %d old GPS records", purged)

                # Purge location access logs past retention (6개월, 위치정보법 제24조)
                purged_logs = await purge_old_location_access_logs(db)
                if purged_logs:
                    logger.info("Cron: purged %d expired location access logs", purged_logs)

                result = await run_daily_pipeline(db, tomorrow)
                await db.commit()
            logger.info("Cron: pipeline complete — %s", result)
        except Exception:
            logger.exception("Cron: daily pipeline failed")

    async def delay_checker_job() -> None:
        """Check for delayed pickups every 5 minutes."""
        from app.modules.scheduling.delay_checker import check_delays

        try:
            async with async_session_factory() as db:
                count = await check_delays(db)
                await db.commit()
                if count:
                    logger.info("Delay checker: processed %d delays", count)
        except Exception:
            logger.exception("Delay checker job failed")

    scheduler = AsyncIOScheduler(timezone="Asia/Seoul")
    scheduler.add_job(
        daily_pipeline_job,
        CronTrigger(
            hour=settings.pipeline_cron_hour,
            minute=settings.pipeline_cron_minute,
        ),
        id="daily_pipeline",
        replace_existing=True,
    )

    from apscheduler.triggers.interval import IntervalTrigger

    scheduler.add_job(
        delay_checker_job,
        IntervalTrigger(minutes=5),
        id="delay_checker",
        replace_existing=True,
    )

    # REG-01: Daily driver qualification re-check at 00:05
    async def qualification_checker_job() -> None:
        from app.modules.auth.qualification_checker import check_driver_qualifications

        try:
            async with async_session_factory() as db:
                result = await check_driver_qualifications(db)
                await db.commit()
                logger.info("Qualification checker: %s", result)
        except Exception:
            logger.exception("Qualification checker job failed")

    scheduler.add_job(
        qualification_checker_job,
        CronTrigger(hour=0, minute=5),
        id="qualification_checker",
        replace_existing=True,
    )

    # REG-02: Daily vehicle compliance check at 00:10
    async def vehicle_compliance_job() -> None:
        from app.modules.vehicle_telemetry.compliance_checker import check_vehicle_compliance

        try:
            async with async_session_factory() as db:
                result = await check_vehicle_compliance(db)
                await db.commit()
                logger.info("Vehicle compliance checker: %s", result)
        except Exception:
            logger.exception("Vehicle compliance checker job failed")

    scheduler.add_job(
        vehicle_compliance_job,
        CronTrigger(hour=0, minute=10),
        id="vehicle_compliance_checker",
        replace_existing=True,
    )

    # P3-77: Daily dispatch notification at 07:00 KST
    async def dispatch_notifier_job() -> None:
        from app.modules.scheduling.daily_dispatch_notifier import send_daily_dispatch_notifications

        today = date.today()
        logger.info("Cron: sending daily dispatch notifications for %s", today)
        try:
            async with async_session_factory() as db:
                sent = await send_daily_dispatch_notifications(db, today)
                await db.commit()
                logger.info("Cron: sent %d dispatch notifications", sent)
        except Exception:
            logger.exception("Dispatch notifier job failed")

    scheduler.add_job(
        dispatch_notifier_job,
        CronTrigger(hour=7, minute=0),
        id="dispatch_notifier",
        replace_existing=True,
    )

    scheduler.start()
    logger.info(
        "Daily pipeline cron started: %02d:%02d KST",
        settings.pipeline_cron_hour,
        settings.pipeline_cron_minute,
    )
    return scheduler


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Startup: verify connections
    await redis_client.ping()

    # Deactivate expired compliance documents on startup
    try:
        from app.modules.compliance.service import deactivate_expired_documents

        async with async_session_factory() as db:
            count = await deactivate_expired_documents(db)
            await db.commit()
            if count:
                logger.info("[COMPLIANCE] Deactivated %d expired documents on startup", count)
    except Exception:
        logger.exception("[COMPLIANCE] Failed to deactivate expired documents on startup")

    # Purge GPS data older than 180 days (위치정보법 제16조) on startup
    try:
        from app.modules.vehicle_telemetry.service import purge_old_gps_data

        async with async_session_factory() as db:
            purged = await purge_old_gps_data(db)
            await db.commit()
            if purged:
                logger.info("[GPS] Purged %d old GPS records on startup", purged)
    except Exception:
        logger.exception("[GPS] Failed to purge old GPS data on startup")

    # Start GPS flush background task
    flush_task = asyncio.create_task(gps_flush_loop())

    # Start daily pipeline cron
    scheduler = _start_daily_cron()

    yield

    # Shutdown
    scheduler.shutdown(wait=False)
    flush_task.cancel()
    import contextlib
    with contextlib.suppress(asyncio.CancelledError):
        await flush_task
    await redis_client.aclose()


def create_app() -> FastAPI:
    from fastapi.middleware.cors import CORSMiddleware

    application = FastAPI(
        title="SAFEWAY KIDS API",
        description="AI-Powered Children's School Shuttle Bus Sharing Platform",
        version="0.1.0",
        lifespan=lifespan,
    )

    # Rate limiter
    application.state.limiter = limiter
    application.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # REG-06: Audit log for 403 access control failures
    from fastapi import Request
    from fastapi.responses import JSONResponse
    from app.common.exceptions import ForbiddenError

    @application.exception_handler(ForbiddenError)
    async def forbidden_audit_handler(request: Request, exc: ForbiddenError) -> JSONResponse:
        client_ip = request.client.host if request.client else "unknown"
        user_info = getattr(request.state, "user_id", None)
        logger.warning(
            "ACCESS_DENIED path=%s method=%s ip=%s user=%s detail=%s",
            request.url.path, request.method, client_ip, user_info, exc.detail,
        )
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    # Request logging
    from app.middleware.request_logging import RequestLoggingMiddleware

    application.add_middleware(RequestLoggingMiddleware)

    # CORS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    from app.modules.academy_management.router import router as academy_router
    from app.modules.auth.router import router as auth_router
    from app.modules.compliance.router import router as compliance_router
    from app.modules.notification.router import router as notification_router
    from app.modules.routing_engine.router import router as routing_router
    from app.modules.scheduling.router import router as scheduling_router
    from app.modules.student_management.router import router as student_router
    from app.modules.vehicle_telemetry.router import router as telemetry_router

    application.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
    application.include_router(compliance_router, prefix="/api/v1/compliance", tags=["compliance"])
    application.include_router(student_router, prefix="/api/v1/students", tags=["students"])
    application.include_router(academy_router, prefix="/api/v1/academies", tags=["academies"])
    application.include_router(scheduling_router, prefix="/api/v1/schedules", tags=["schedules"])
    application.include_router(telemetry_router, prefix="/api/v1/telemetry", tags=["telemetry"])
    application.include_router(
        notification_router, prefix="/api/v1/notifications", tags=["notifications"]
    )
    application.include_router(routing_router, prefix="/api/v1/routes", tags=["routes"])

    from app.modules.admin.router import router as admin_router
    from app.modules.billing.router import router as billing_router
    from app.modules.contact.router import router as contact_router
    from app.modules.escort.router import router as escort_router
    from app.modules.integration.router import router as integration_router
    from app.modules.messaging.router import router as messaging_router
    from app.modules.edge_gateway.router import router as edge_router
    application.include_router(admin_router, prefix="/api/v1/admin", tags=["admin"])
    application.include_router(billing_router, prefix="/api/v1/billing", tags=["billing"])
    application.include_router(contact_router, prefix="/api/v1/contact", tags=["contact"])
    application.include_router(escort_router, prefix="/api/v1/escorts", tags=["escorts"])
    application.include_router(integration_router, prefix="/api/v1/integration", tags=["integration"])
    application.include_router(messaging_router, prefix="/api/v1/messages", tags=["messages"])
    application.include_router(edge_router, prefix="/api/v1/edge", tags=["edge-ai"])

    @application.get("/health")
    async def health_check() -> dict:
        """서비스 상태 확인"""
        from app.database import engine

        checks: dict = {"service": "safeway-kids", "status": "ok"}
        try:
            await redis_client.ping()
            checks["redis"] = "connected"
        except Exception:
            checks["redis"] = "disconnected"
            checks["status"] = "degraded"

        try:
            async with engine.connect() as conn:
                from sqlalchemy import text
                await conn.execute(text("SELECT 1"))
            checks["database"] = "connected"
        except Exception:
            checks["database"] = "disconnected"
            checks["status"] = "degraded"

        return checks

    # Prometheus metrics
    Instrumentator().instrument(application).expose(application, endpoint="/metrics")

    return application


app = create_app()
