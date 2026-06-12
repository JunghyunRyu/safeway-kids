"""PT 가입 동의 게이트 + Firebase 브리지 통합 테스트 — Tech Spec FR-C/FR-F (2026-06-11).

Firebase Admin SDK는 전부 mock — 네트워크 호출 0. OTP는 fakeredis 경유의
실제 send/verify 흐름 대신 redis에 코드를 직접 심는 기존 패턴을 따른다.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator
from unittest.mock import patch

import fakeredis.aioredis
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.consent_docs import CONSENT_DOC_VERSIONS
from app.modules.auth.models import (
    APP_PETTRACKER,
    User,
    UserConsent,
    UserRole,
)
from app.modules.auth.service import create_access_token

V = CONSENT_DOC_VERSIONS  # shorthand

REQUIRED_OWNER = [
    {"doc_type": "terms", "doc_version": V["terms"]},
    {"doc_type": "privacy", "doc_version": V["privacy"]},
    {"doc_type": "age14", "doc_version": V["age14"]},
]
LOCATION = {"doc_type": "location", "doc_version": V["location"]}

_fake_redis = fakeredis.aioredis.FakeRedis(decode_responses=True)


@pytest.fixture(autouse=True)
async def _otp_test_env() -> AsyncGenerator[None, None]:
    """fakeredis 주입 (repo 컨벤션) + 본 모듈의 다회 OTP 호출 대비 rate limit 해제."""
    from app.rate_limit import limiter

    limiter.enabled = False
    with patch("app.modules.auth.service.redis_client", _fake_redis):
        yield
    limiter.enabled = True
    await _fake_redis.flushall()


async def _seed_otp(phone: str, code: str = "123456") -> None:
    await _fake_redis.set(f"otp:{phone}", code, ex=180)


def _verify_payload(phone: str, role: str = "pet_owner", **overrides) -> dict:
    payload = {
        "phone": phone,
        "code": "123456",
        "name": "테스트 보호자",
        "role": role,
        "app_context": "pettracker",
    }
    payload.update(overrides)
    return payload


# ---------- FR-C3: OTP 가입 동의 게이트 ----------


async def test_pt_new_user_without_consents_rejected(client: AsyncClient) -> None:
    await _seed_otp("01055550001")
    resp = await client.post("/api/v1/auth/otp/verify", json=_verify_payload("01055550001"))
    assert resp.status_code == 422
    detail = resp.json()["detail"]
    assert set(detail["missing_consents"]) == {"terms", "privacy", "age14"}


async def test_pt_new_owner_with_required_consents_registered(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    await _seed_otp("01055550002")
    resp = await client.post(
        "/api/v1/auth/otp/verify",
        json=_verify_payload("01055550002", consents=REQUIRED_OWNER),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["required_consents"] is None

    user_id = uuid.UUID(body["user"]["id"])
    rows = (
        await db_session.execute(
            select(UserConsent).where(UserConsent.user_id == user_id)
        )
    ).scalars().all()
    assert {r.doc_type for r in rows} == {"terms", "privacy", "age14"}
    assert all(r.doc_version == V[r.doc_type] for r in rows)
    assert all(r.consent_method == "mobile_checkbox_v1" for r in rows)
    assert all(r.granted_at is not None for r in rows)


async def test_pt_new_walker_requires_location_consent(client: AsyncClient) -> None:
    await _seed_otp("01055550003")
    resp = await client.post(
        "/api/v1/auth/otp/verify",
        json=_verify_payload("01055550003", role="walker", consents=REQUIRED_OWNER),
    )
    assert resp.status_code == 422
    assert resp.json()["detail"]["missing_consents"] == ["location"]

    await _seed_otp("01055550003")
    resp = await client.post(
        "/api/v1/auth/otp/verify",
        json=_verify_payload(
            "01055550003", role="walker", consents=[*REQUIRED_OWNER, LOCATION]
        ),
    )
    assert resp.status_code == 200


async def test_pt_new_user_requires_name(client: AsyncClient) -> None:
    await _seed_otp("01055550004")
    resp = await client.post(
        "/api/v1/auth/otp/verify",
        json=_verify_payload("01055550004", name="", consents=REQUIRED_OWNER),
    )
    assert resp.status_code == 422


async def test_consent_version_mismatch_rejected(client: AsyncClient) -> None:
    await _seed_otp("01055550005")
    stale = [{"doc_type": "terms", "doc_version": "1999-01-01"}, *REQUIRED_OWNER[1:]]
    resp = await client.post(
        "/api/v1/auth/otp/verify",
        json=_verify_payload("01055550005", consents=stale),
    )
    assert resp.status_code == 422


async def test_pt_existing_user_login_flags_missing_consents(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    # 동의 도입 전 가입자 시뮬레이션 — 동의 행 없는 기존 사용자
    user = User(
        role=UserRole.PET_OWNER,
        phone="01055550006",
        name="기존 보호자",
        app_context=APP_PETTRACKER,
    )
    db_session.add(user)
    await db_session.commit()

    await _seed_otp("01055550006")
    resp = await client.post(
        "/api/v1/auth/otp/verify",
        json=_verify_payload("01055550006", name=""),
    )
    assert resp.status_code == 200  # 로그인은 허용
    assert set(resp.json()["required_consents"]) == {"terms", "privacy", "age14"}
    # 빈 name은 기존 이름을 덮어쓰지 않는다 (FR-M3)
    await db_session.refresh(user)
    assert user.name == "기존 보호자"


async def test_safeway_signup_unaffected_by_consent_gate(client: AsyncClient) -> None:
    await _seed_otp("01055550007")
    resp = await client.post(
        "/api/v1/auth/otp/verify",
        json={
            "phone": "01055550007",
            "code": "123456",
            "name": "학부모",
            "role": "parent",
        },
    )
    assert resp.status_code == 200
    assert resp.json()["required_consents"] is None


# ---------- FR-C4: 동의 조회/추가/철회 ----------


async def test_consent_grant_and_withdraw_cycle(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    user = User(
        role=UserRole.PET_OWNER,
        phone="01055550008",
        name="동의 테스트",
        app_context=APP_PETTRACKER,
    )
    db_session.add(user)
    await db_session.commit()
    headers = {
        "Authorization": f"Bearer {create_access_token(user.id, user.role, APP_PETTRACKER)}"
    }

    resp = await client.get("/api/v1/auth/consents", headers=headers)
    assert resp.status_code == 200
    assert set(resp.json()["missing_required"]) == {"terms", "privacy", "age14"}

    resp = await client.post(
        "/api/v1/auth/consents",
        headers=headers,
        json={"grant": [*REQUIRED_OWNER, {"doc_type": "marketing", "doc_version": V["marketing"]}]},
    )
    assert resp.status_code == 200
    assert resp.json()["missing_required"] == []

    resp = await client.post(
        "/api/v1/auth/consents", headers=headers, json={"withdraw": ["marketing"]}
    )
    assert resp.status_code == 200
    marketing = [
        c for c in resp.json()["consents"] if c["doc_type"] == "marketing"
    ]
    assert marketing and marketing[0]["withdrawn_at"] is not None


# ---------- FR-F1/F2: Firebase 브리지 보안 ----------


@pytest.fixture
async def pt_owner(db_session: AsyncSession) -> User:
    user = User(
        role=UserRole.PET_OWNER,
        phone="01055550100",
        name="브리지 보호자",
        app_context=APP_PETTRACKER,
    )
    db_session.add(user)
    await db_session.commit()
    return user


def _auth(user: User) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {create_access_token(user.id, user.role, user.app_context)}"
    }


async def test_custom_token_uid_derived_from_server_record(
    client: AsyncClient, db_session: AsyncSession, pt_owner: User
) -> None:
    attacker_uid = "someone-elses-uid"
    with patch(
        "app.middleware.firebase_auth.create_custom_token_async"
    ) as mock_create:
        mock_create.return_value = "mock-custom-token"
        resp = await client.post(
            "/api/v1/auth/firebase/custom-token",
            headers=_auth(pt_owner),
            # uid를 본문으로 보내도 무시되어야 한다 (security MUST)
            json={"firebase_uid": attacker_uid},
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["custom_token"] == "mock-custom-token"
    assert body["firebase_uid"] != attacker_uid

    await db_session.refresh(pt_owner)
    assert pt_owner.firebase_uid == str(pt_owner.id)  # 서버 유래 uid
    mock_create.assert_called_once_with(str(pt_owner.id))


async def test_firebase_link_idempotent_and_conflict(
    client: AsyncClient, db_session: AsyncSession, pt_owner: User
) -> None:
    with patch("app.middleware.firebase_auth._verify_id_token") as mock_verify:
        mock_verify.return_value = {"uid": "fb-uid-link-1"}
        resp = await client.post(
            "/api/v1/auth/firebase/link",
            headers=_auth(pt_owner),
            json={"id_token": "dummy"},
        )
        assert resp.status_code == 200

        # 멱등 — 같은 uid 재호출 200
        resp = await client.post(
            "/api/v1/auth/firebase/link",
            headers=_auth(pt_owner),
            json={"id_token": "dummy"},
        )
        assert resp.status_code == 200

        # 충돌 — 타 사용자가 같은 uid 연결 시도 → 409
        other = User(
            role=UserRole.PET_OWNER,
            phone="01055550101",
            name="다른 보호자",
            app_context=APP_PETTRACKER,
        )
        db_session.add(other)
        await db_session.commit()
        resp = await client.post(
            "/api/v1/auth/firebase/link",
            headers=_auth(other),
            json={"id_token": "dummy"},
        )
        assert resp.status_code == 409


async def test_dual_auth_jwt_path_still_works(
    client: AsyncClient, pt_owner: User
) -> None:
    # PT 라우터가 듀얼 인증으로 바뀌어도 기존 JWT 호출은 그대로 동작 (FR-F5)
    resp = await client.get("/api/v1/pt/pets", headers=_auth(pt_owner))
    assert resp.status_code == 200


async def test_dual_auth_firebase_path(
    client: AsyncClient, db_session: AsyncSession, pt_owner: User
) -> None:
    pt_owner.firebase_uid = "fb-uid-dual"
    await db_session.commit()
    with patch("app.middleware.firebase_auth._verify_id_token") as mock_verify:
        mock_verify.return_value = {"uid": "fb-uid-dual"}
        resp = await client.get(
            "/api/v1/pt/pets",
            headers={"Authorization": "Bearer not-a-local-jwt"},
        )
    assert resp.status_code == 200


async def test_dual_auth_rejects_unknown_token(client: AsyncClient) -> None:
    with patch("app.middleware.firebase_auth._verify_id_token") as mock_verify:
        from app.common.exceptions import UnauthorizedError

        mock_verify.side_effect = UnauthorizedError(detail="Firebase ID 토큰 검증 실패")
        resp = await client.get(
            "/api/v1/pt/pets",
            headers={"Authorization": "Bearer garbage-token"},
        )
    assert resp.status_code == 401


# ---------- FR-F6: Kakao redirect_uri allowlist ----------


async def test_kakao_rejects_unlisted_redirect_uri(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/auth/kakao",
        json={"code": "dummy", "redirect_uri": "https://evil.example.com/cb"},
    )
    assert resp.status_code == 422
