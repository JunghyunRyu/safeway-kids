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
        from app.modules.scheduling.scheduler import run_daily_pipeline

        tomorrow = date.today() + timedelta(days=1)
        logger.info("Cron: running daily pipeline for %s", tomorrow)
        try:
            async with async_session_factory() as db:
                result = await run_daily_pipeline(db, tomorrow)
                await db.commit()
            logger.info("Cron: pipeline complete — %s", result)
        except Exception:
            logger.exception("Cron: daily pipeline failed")

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
    application.include_router(admin_router, prefix="/api/v1/admin", tags=["admin"])
    application.include_router(billing_router, prefix="/api/v1/billing", tags=["billing"])
    application.include_router(contact_router, prefix="/api/v1/contact", tags=["contact"])
    application.include_router(escort_router, prefix="/api/v1/escorts", tags=["escorts"])

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
