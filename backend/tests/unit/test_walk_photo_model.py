"""WalkPhoto 모델 계약 테스트 — Tech Spec FR-B2 / FR-F2 (P1-3 슬라이스).

WalkPhoto는 로직이 없는 순수 데이터 모델이므로, 본 테스트는 ORM 동작이 아니라
스펙이 명시한 스키마 계약(컬럼 집합·기본값·FK·인덱스·enum 값)을 고정한다.
컬럼 rename·기본값 변경·enum 드리프트를 회귀로 잡는 가드 역할.

마이그레이션의 실 DB 적용·롤백은 alembic upgrade/downgrade로 별도 검증됨
(artifacts/handoffs/2026-05-22-*-handoff 참조).
"""

from app.apps.pettracker.models import (
    PetCondition,
    WalkPhoto,
    WalkPhotoCaptionStatus,
)


def test_walk_photo_tablename() -> None:
    assert WalkPhoto.__tablename__ == "walk_photos"


def test_walk_photo_column_set() -> None:
    """FR-B2: id, session_id, s3_key, caption, caption_status, created_at + FR-F2: condition."""
    assert set(WalkPhoto.__table__.columns.keys()) == {
        "id",
        "session_id",
        "s3_key",
        "caption",
        "caption_status",
        "condition",
        "created_at",
    }


def test_walk_photo_nullability() -> None:
    cols = WalkPhoto.__table__.columns
    # 필수: id, session_id, s3_key, caption_status, created_at
    assert cols["id"].primary_key is True
    assert cols["session_id"].nullable is False
    assert cols["s3_key"].nullable is False
    assert cols["caption_status"].nullable is False
    assert cols["created_at"].nullable is False
    # 선택: caption(생성 전 None), condition(FR-F2 Optional)
    assert cols["caption"].nullable is True
    assert cols["condition"].nullable is True


def test_caption_status_defaults_to_pending() -> None:
    """FR-B2: 사진 INSERT 직후 caption_status="pending" (캡션 BackgroundTask 대기)."""
    default = WalkPhoto.__table__.columns["caption_status"].default
    assert default is not None
    assert default.arg == "pending"


def test_session_id_foreign_key_targets_walk_sessions() -> None:
    fks = list(WalkPhoto.__table__.columns["session_id"].foreign_keys)
    assert len(fks) == 1
    assert fks[0].target_fullname == "walk_sessions.id"


def test_session_created_index_exists() -> None:
    """GET /pt/walks/{id}/photos — session별 시간순 조회 인덱스 (FR-B7)."""
    idx = {i.name: [c.name for c in i.columns] for i in WalkPhoto.__table__.indexes}
    assert idx == {"ix_walk_photos_session_created": ["session_id", "created_at"]}


def test_caption_status_enum_matches_spec() -> None:
    """FR-B2: caption_status enum = pending|generated|edited|failed."""
    assert [e.value for e in WalkPhotoCaptionStatus] == [
        "pending",
        "generated",
        "edited",
        "failed",
    ]


def test_pet_condition_enum_matches_spec() -> None:
    """FR-F1: condition = 활기|평온|지친_듯|이상|불명 (한국어 라벨 그대로 저장)."""
    assert [e.value for e in PetCondition] == [
        "활기",
        "평온",
        "지친_듯",
        "이상",
        "불명",
    ]
