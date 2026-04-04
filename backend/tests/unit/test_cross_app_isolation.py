"""Cross-app isolation tests — verify that JWT tokens from one app
cannot grant access to another app's endpoints via RBAC."""

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.modules.auth.models import (
    APP_CARECONNECT,
    APP_PETTRACKER,
    APP_SAFEWAY_KIDS,
    User,
    UserRole,
)
from app.modules.auth.service import create_access_token, decode_token


class TestJWTAppContext:
    """Test that JWT tokens carry correct app_context."""

    def test_safeway_parent_token_has_safeway_context(self) -> None:
        token = create_access_token(uuid.uuid4(), UserRole.PARENT, APP_SAFEWAY_KIDS)
        payload = decode_token(token)
        assert payload["app_context"] == APP_SAFEWAY_KIDS
        assert payload["role"] == "parent"

    def test_pettracker_owner_token_has_pt_context(self) -> None:
        token = create_access_token(uuid.uuid4(), UserRole.PET_OWNER, APP_PETTRACKER)
        payload = decode_token(token)
        assert payload["app_context"] == APP_PETTRACKER
        assert payload["role"] == "pet_owner"

    def test_careconnect_parent_token_has_cc_context(self) -> None:
        token = create_access_token(uuid.uuid4(), UserRole.PARENT, APP_CARECONNECT)
        payload = decode_token(token)
        assert payload["app_context"] == APP_CARECONNECT
        assert payload["role"] == "parent"

    def test_walker_token_has_pt_context(self) -> None:
        token = create_access_token(uuid.uuid4(), UserRole.WALKER, APP_PETTRACKER)
        payload = decode_token(token)
        assert payload["app_context"] == APP_PETTRACKER
        assert payload["role"] == "walker"

    def test_caregiver_token_has_cc_context(self) -> None:
        token = create_access_token(uuid.uuid4(), UserRole.CAREGIVER, APP_CARECONNECT)
        payload = decode_token(token)
        assert payload["app_context"] == APP_CARECONNECT
        assert payload["role"] == "caregiver"

    def test_platform_admin_has_safeway_context(self) -> None:
        token = create_access_token(uuid.uuid4(), UserRole.PLATFORM_ADMIN, APP_SAFEWAY_KIDS)
        payload = decode_token(token)
        assert payload["app_context"] == APP_SAFEWAY_KIDS
        assert payload["role"] == "platform_admin"


class TestRBACAppContext:
    """Test that RBAC role checkers enforce app_context."""

    def _make_user(self, role: UserRole, app_context: str) -> User:
        user = MagicMock(spec=User)
        user.role = role
        user.app_context = app_context
        user._jwt_app_context = app_context
        return user

    @pytest.mark.asyncio
    async def test_safeway_parent_blocked_from_pettracker(self) -> None:
        """SafeWay Kids PARENT should NOT pass PetTracker PET_OWNER check."""
        from app.common.exceptions import ForbiddenError
        from app.middleware.rbac import require_roles

        checker_fn = require_roles(UserRole.PET_OWNER, app_context=APP_PETTRACKER)
        user = self._make_user(UserRole.PARENT, APP_SAFEWAY_KIDS)
        with pytest.raises(ForbiddenError):
            await checker_fn(current_user=user)

    @pytest.mark.asyncio
    async def test_safeway_parent_blocked_from_careconnect(self) -> None:
        """SafeWay Kids PARENT should NOT pass CareConnect PARENT check
        because app_context differs."""
        from app.common.exceptions import ForbiddenError
        from app.middleware.rbac import require_roles

        checker_fn = require_roles(UserRole.PARENT, app_context=APP_CARECONNECT)
        # The checker_fn is a dependency function that takes current_user
        # We simulate by calling it directly
        user = self._make_user(UserRole.PARENT, APP_SAFEWAY_KIDS)
        with pytest.raises(ForbiddenError):
            await checker_fn(current_user=user)

    @pytest.mark.asyncio
    async def test_pettracker_walker_blocked_from_careconnect(self) -> None:
        """PetTracker WALKER should NOT access CareConnect endpoints."""
        from app.common.exceptions import ForbiddenError
        from app.middleware.rbac import require_roles

        checker_fn = require_roles(UserRole.CAREGIVER, app_context=APP_CARECONNECT)
        user = self._make_user(UserRole.WALKER, APP_PETTRACKER)
        with pytest.raises(ForbiddenError):
            await checker_fn(current_user=user)

    @pytest.mark.asyncio
    async def test_careconnect_caregiver_blocked_from_pettracker(self) -> None:
        """CareConnect CAREGIVER should NOT access PetTracker endpoints."""
        from app.common.exceptions import ForbiddenError
        from app.middleware.rbac import require_roles

        checker_fn = require_roles(UserRole.WALKER, app_context=APP_PETTRACKER)
        user = self._make_user(UserRole.CAREGIVER, APP_CARECONNECT)
        with pytest.raises(ForbiddenError):
            await checker_fn(current_user=user)

    @pytest.mark.asyncio
    async def test_pettracker_owner_passes_own_app(self) -> None:
        """PetTracker PET_OWNER should pass PetTracker check."""
        from app.middleware.rbac import require_roles

        checker_fn = require_roles(UserRole.PET_OWNER, app_context=APP_PETTRACKER)
        user = self._make_user(UserRole.PET_OWNER, APP_PETTRACKER)
        result = await checker_fn(current_user=user)
        assert result.role == UserRole.PET_OWNER

    @pytest.mark.asyncio
    async def test_careconnect_parent_passes_own_app(self) -> None:
        """CareConnect PARENT should pass CareConnect check."""
        from app.middleware.rbac import require_roles

        checker_fn = require_roles(UserRole.PARENT, app_context=APP_CARECONNECT)
        user = self._make_user(UserRole.PARENT, APP_CARECONNECT)
        result = await checker_fn(current_user=user)
        assert result.role == UserRole.PARENT

    @pytest.mark.asyncio
    async def test_platform_admin_passes_all_apps(self) -> None:
        """PLATFORM_ADMIN should bypass app_context check."""
        from app.middleware.rbac import require_roles

        user = self._make_user(UserRole.PLATFORM_ADMIN, APP_SAFEWAY_KIDS)

        # Should pass PetTracker check
        checker_pt = require_roles(UserRole.PET_OWNER, app_context=APP_PETTRACKER)
        result = await checker_pt(current_user=user)
        assert result.role == UserRole.PLATFORM_ADMIN

        # Should pass CareConnect check
        checker_cc = require_roles(UserRole.CAREGIVER, app_context=APP_CARECONNECT)
        result = await checker_cc(current_user=user)
        assert result.role == UserRole.PLATFORM_ADMIN


class TestRoleAppMapping:
    """Test role-to-app mapping consistency."""

    def test_new_roles_exist(self) -> None:
        assert UserRole.PET_OWNER == "pet_owner"
        assert UserRole.WALKER == "walker"
        assert UserRole.CAREGIVER == "caregiver"

    def test_existing_roles_unchanged(self) -> None:
        assert UserRole.PARENT == "parent"
        assert UserRole.DRIVER == "driver"
        assert UserRole.STUDENT == "student"
        assert UserRole.SAFETY_ESCORT == "safety_escort"
        assert UserRole.ACADEMY_ADMIN == "academy_admin"
        assert UserRole.PLATFORM_ADMIN == "platform_admin"

    def test_app_constants(self) -> None:
        assert APP_SAFEWAY_KIDS == "safeway_kids"
        assert APP_PETTRACKER == "pettracker"
        assert APP_CARECONNECT == "careconnect"
