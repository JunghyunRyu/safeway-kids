"""Student.name 평문 → AES-GCM + HMAC hash 백필 스크립트 (카드 #4 spec FR-2).

prod 데이터 이전 시 사용. 본 마이그레이션 e7a9b2c4d6f8 실행 *전*에 다음 절차로 운영한다:

1. 임시 단계: 마이그레이션 e7a9b2c4d6f8 upgrade()의 Step 1만 수동 실행
   (alembic CLI 직접 호출 또는 SQL 직접 실행: `ALTER TABLE students ADD COLUMN name_encrypted VARCHAR(500); ADD COLUMN name_hash VARCHAR(64);`)
2. 본 스크립트 실행 — 기존 평문 name → name_encrypted + name_hash 백필
3. 백필 검증 — 모든 students.name_hash NOT NULL + uniqueness 충돌 없음 확인
4. 마이그레이션 e7a9b2c4d6f8 나머지 Step 3·4·5 수동 실행 (drop_constraint, drop_column name, alter NOT NULL, create_index, create_unique_constraint)

Usage:
    python -m scripts.backfill_student_name [--dry-run]
"""
from __future__ import annotations

import argparse
import asyncio
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.security import compute_name_hash, encrypt_value
from app.database import async_session_factory


async def backfill(dry_run: bool = False) -> dict:
    """기존 students 테이블의 name 평문을 name_encrypted + name_hash로 백필.

    Returns: {"total": N, "updated": M, "skipped": K, "errors": [...]}
    """
    stats = {"total": 0, "updated": 0, "skipped": 0, "errors": []}
    async with async_session_factory() as db:  # type: AsyncSession
        # 평문 name이 있고 name_encrypted가 비어있는 row 추출
        rows = await db.execute(
            text(
                "SELECT id, name FROM students "
                "WHERE name IS NOT NULL AND name_encrypted IS NULL"
            )
        )
        records = rows.fetchall()
        stats["total"] = len(records)

        for row in records:
            student_id, plaintext_name = row[0], row[1]
            if not plaintext_name or not plaintext_name.strip():
                stats["skipped"] += 1
                continue
            try:
                enc = encrypt_value(plaintext_name)
                h = compute_name_hash(plaintext_name)
                if dry_run:
                    print(f"  [DRY-RUN] {student_id}: name='{plaintext_name}' → hash={h[:12]}...")
                else:
                    await db.execute(
                        text(
                            "UPDATE students "
                            "SET name_encrypted = :enc, name_hash = :h "
                            "WHERE id = :sid"
                        ),
                        {"enc": enc, "h": h, "sid": student_id},
                    )
                stats["updated"] += 1
            except Exception as e:
                stats["errors"].append({"id": str(student_id), "error": str(e)})

        if not dry_run:
            await db.commit()
    return stats


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="실제 UPDATE 없이 변환 결과만 출력")
    args = parser.parse_args()

    print(f"[Backfill] dry_run={args.dry_run}")
    stats = asyncio.run(backfill(dry_run=args.dry_run))
    print(f"  Total scanned: {stats['total']}")
    print(f"  Updated:       {stats['updated']}")
    print(f"  Skipped:       {stats['skipped']}")
    if stats["errors"]:
        print(f"  ERRORS ({len(stats['errors'])}):")
        for e in stats["errors"]:
            print(f"    - {e['id']}: {e['error']}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
