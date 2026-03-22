"""ITEM-REG-02: Daily vehicle compliance checker.

Runs daily at 00:10 — deactivates vehicles with expired insurance or safety
inspection, and warns about upcoming expirations.
"""

import logging
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.vehicle_telemetry.models import Vehicle

logger = logging.getLogger(__name__)


async def check_vehicle_compliance(db: AsyncSession) -> dict:
    """Re-evaluate all vehicle compliance. Returns summary counts."""
    today = date.today()
    warning_threshold = today + timedelta(days=30)

    stmt = select(Vehicle)
    result = await db.execute(stmt)
    vehicles = list(result.scalars().all())

    deactivated = 0
    warnings = 0
    unregistered = 0

    for v in vehicles:
        was_active = v.is_active

        # Insurance expired → deactivate
        if v.insurance_expiry and v.insurance_expiry <= today and v.is_active:
            v.is_active = False
            deactivated += 1
            logger.warning(
                "[VEHICLE] Deactivated vehicle %s (plate=%s): insurance expired %s",
                v.id, v.license_plate, v.insurance_expiry,
            )

        # Safety inspection expired → deactivate
        if v.safety_inspection_expiry and v.safety_inspection_expiry <= today and v.is_active:
            v.is_active = False
            if was_active:  # Don't double-count
                deactivated += 1
            logger.warning(
                "[VEHICLE] Deactivated vehicle %s (plate=%s): safety inspection expired %s",
                v.id, v.license_plate, v.safety_inspection_expiry,
            )

        # Unregistered (no school bus registration number)
        if not v.school_bus_registration_no:
            unregistered += 1

        # 30-day expiry warning
        expiring_soon = []
        if v.insurance_expiry and today < v.insurance_expiry <= warning_threshold:
            expiring_soon.append(f"보험 만료 {v.insurance_expiry}")
        if v.safety_inspection_expiry and today < v.safety_inspection_expiry <= warning_threshold:
            expiring_soon.append(f"차량검사 만료 {v.safety_inspection_expiry}")
        if v.registration_expiry and today < v.registration_expiry <= warning_threshold:
            expiring_soon.append(f"등록 만료 {v.registration_expiry}")

        if expiring_soon:
            warnings += 1
            logger.info(
                "[VEHICLE] Vehicle %s (plate=%s) expiring soon: %s",
                v.id, v.license_plate, ", ".join(expiring_soon),
            )

    if deactivated:
        await db.flush()

    summary = {
        "total_checked": len(vehicles),
        "deactivated": deactivated,
        "unregistered": unregistered,
        "warnings_30day": warnings,
    }
    logger.info("[VEHICLE] Daily compliance check complete: %s", summary)
    return summary
