from collections.abc import Callable

from fastapi import Depends

from app.common.exceptions import ForbiddenError
from app.middleware.auth import get_current_user
from app.modules.auth.models import User, UserRole


def require_roles(*roles: UserRole) -> Callable:
    """Dependency that checks if the current user has one of the required roles."""

    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in roles:
            raise ForbiddenError(
                detail=f"접근 권한이 없습니다. 필요: {', '.join(r.value for r in roles)}"
            )
        return current_user

    return role_checker


# Pre-built role checkers for common patterns
require_parent = require_roles(UserRole.PARENT)
require_driver = require_roles(UserRole.DRIVER, UserRole.SAFETY_ESCORT)
require_academy_admin = require_roles(UserRole.ACADEMY_ADMIN)
require_platform_admin = require_roles(UserRole.PLATFORM_ADMIN)
require_any_admin = require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
