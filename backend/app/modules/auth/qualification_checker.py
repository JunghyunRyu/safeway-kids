"""ITEM-REG-01: Daily driver qualification re-check.

Runs daily at 00:05 — recalculates `is_qualified` for all DriverQualification
records based on current date against license_expiry, safety_training_expiry,
and criminal_check_date.
"""

import logging
from datetime import date, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import DriverQualification, User, UserRole

logger = logging.getLogger(__name__)


async def check_driver_qualifications(db: AsyncSession) -> dict:
    """Re-evaluate all driver qualifications. Returns summary counts."""
    today = date.today()
    warning_threshold = today + timedelta(days=30)

    stmt = select(DriverQualification)
    result = await db.execute(stmt)
    qualifications = list(result.scalars().all())

    disqualified = 0
    warnings = 0

    for dq in qualifications:
        was_qualified = dq.is_qualified
        now_qualified = True

        # License expired
        if dq.license_expiry and dq.license_expiry <= today:
            now_qualified = False

        # Safety training expired
        if dq.safety_training_expiry and dq.safety_training_expiry <= today:
            now_qualified = False

        # Criminal check older than 1 year
        if dq.criminal_check_date:
            if dq.criminal_check_date + timedelta(days=365) < today:
                now_qualified = False
        else:
            # No criminal check at all
            now_qualified = False

        if was_qualified and not now_qualified:
            dq.is_qualified = False
            disqualified += 1
            logger.warning(
                "[QUALIFICATION] Driver user_id=%s disqualified: "
                "license_expiry=%s, safety_training_expiry=%s, criminal_check=%s",
                dq.user_id, dq.license_expiry, dq.safety_training_expiry,
                dq.criminal_check_date,
            )
        elif not was_qualified and now_qualified:
            dq.is_qualified = True

        # 30-day expiry warning
        expiring_soon = []
        if dq.license_expiry and today < dq.license_expiry <= warning_threshold:
            expiring_soon.append(f"면허 만료 {dq.license_expiry}")
        if dq.safety_training_expiry and today < dq.safety_training_expiry <= warning_threshold:
            expiring_soon.append(f"안전교육 만료 {dq.safety_training_expiry}")

        if expiring_soon:
            warnings += 1
            logger.info(
                "[QUALIFICATION] Driver user_id=%s expiring soon: %s",
                dq.user_id, ", ".join(expiring_soon),
            )

    if disqualified or warnings:
        await db.flush()

    summary = {
        "total_checked": len(qualifications),
        "disqualified": disqualified,
        "warnings_30day": warnings,
    }
    logger.info("[QUALIFICATION] Daily check complete: %s", summary)
    return summary
