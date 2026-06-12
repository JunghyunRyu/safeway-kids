from collections.abc import Callable

from fastapi import Depends

from app.common.exceptions import ForbiddenError
from app.middleware.auth import get_current_user
from app.modules.auth.models import (
    APP_CARECONNECT,
    APP_PETTRACKER,
    APP_SAFEWAY_KIDS,
    User,
    UserRole,
)


def require_roles(*roles: UserRole, app_context: str | None = None) -> Callable:
    """Dependency that checks if the current user has one of the required roles.

    If app_context is specified, also verifies the user belongs to that app.
    PLATFORM_ADMIN bypasses app_context checks (can access all apps).
    """

    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        # PLATFORM_ADMIN can access all apps
        if current_user.role == UserRole.PLATFORM_ADMIN:
            return current_user

        if current_user.role not in roles:
            raise ForbiddenError(
                detail=f"접근 권한이 없습니다. 필요: {', '.join(r.value for r in roles)}"
            )

        # Verify app_context if specified
        if app_context is not None:
            user_app = getattr(current_user, "app_context", APP_SAFEWAY_KIDS)
            if user_app != app_context:
                raise ForbiddenError(
                    detail=f"이 앱에 대한 접근 권한이 없습니다. (요청: {app_context}, 사용자: {user_app})"
                )

        return current_user

    return role_checker


# --- SafeWay Kids role checkers (backwards-compatible) ---
require_parent = require_roles(UserRole.PARENT, app_context=APP_SAFEWAY_KIDS)
require_driver = require_roles(UserRole.DRIVER, UserRole.SAFETY_ESCORT, app_context=APP_SAFEWAY_KIDS)
require_academy_admin = require_roles(UserRole.ACADEMY_ADMIN, app_context=APP_SAFEWAY_KIDS)
require_platform_admin = require_roles(UserRole.PLATFORM_ADMIN)
require_any_admin = require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)

# --- PetTracker role checkers ---
require_pet_owner = require_roles(UserRole.PET_OWNER, app_context=APP_PETTRACKER)
require_walker = require_roles(UserRole.WALKER, app_context=APP_PETTRACKER)
require_pt_any = require_roles(UserRole.PET_OWNER, UserRole.WALKER, app_context=APP_PETTRACKER)

# --- CareConnect role checkers ---
require_cc_parent = require_roles(UserRole.PARENT, app_context=APP_CARECONNECT)
require_caregiver = require_roles(UserRole.CAREGIVER, app_context=APP_CARECONNECT)
require_cc_any = require_roles(UserRole.PARENT, UserRole.CAREGIVER, app_context=APP_CARECONNECT)


def require_roles_dual(*roles: UserRole, app_context: str | None = None) -> Callable:
    """require_roles의 듀얼 인증(JWT→Firebase) 버전 — Tech Spec FR-F5 (2026-06-11).

    PT/CC 라우터 전용. SafeWay 체커(require_roles)는 JWT 단일 경로 불변.
    """
    from app.middleware.firebase_auth import get_current_user_dual

    async def role_checker(
        current_user: User = Depends(get_current_user_dual),
    ) -> User:
        if current_user.role == UserRole.PLATFORM_ADMIN:
            return current_user

        if current_user.role not in roles:
            raise ForbiddenError(
                detail=f"접근 권한이 없습니다. 필요: {', '.join(r.value for r in roles)}"
            )

        if app_context is not None:
            user_app = getattr(current_user, "app_context", APP_SAFEWAY_KIDS)
            if user_app != app_context:
                raise ForbiddenError(
                    detail=f"이 앱에 대한 접근 권한이 없습니다. (요청: {app_context}, 사용자: {user_app})"
                )

        return current_user

    return role_checker


# --- PetTracker dual-auth role checkers (FR-F5) ---
require_pet_owner_dual = require_roles_dual(UserRole.PET_OWNER, app_context=APP_PETTRACKER)
require_walker_dual = require_roles_dual(UserRole.WALKER, app_context=APP_PETTRACKER)
require_pt_any_dual = require_roles_dual(
    UserRole.PET_OWNER, UserRole.WALKER, app_context=APP_PETTRACKER
)


def require_academy_sub_roles(*sub_roles: str) -> Callable:
    """P3-67: Check academy_sub_role. owner/manager/staff."""

    async def checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role == UserRole.PLATFORM_ADMIN:
            return current_user
        if current_user.role != UserRole.ACADEMY_ADMIN:
            raise ForbiddenError(detail="학원 관리자 권한이 필요합니다")
        sub = getattr(current_user, "academy_sub_role", None) or "owner"
        if sub not in sub_roles:
            raise ForbiddenError(
                detail=f"접근 권한이 없습니다. 필요: {', '.join(sub_roles)}"
            )
        return current_user

    return checker
