"""SafeWay Kids — Demo consent reset.

미팅 시연 전 ConsentScreen이 빈 상태로 다시 뜨도록, 박보호자(또는 인자로 받은
phone) user의 동의 row를 4개 테이블에서 삭제한다.

사용법:
  python scripts/reset_demo_consent.py            # default: 01033333333 (박보호자)
  python scripts/reset_demo_consent.py 01044444444  # 다른 학부모 phone

production 환경에서는 실행 거부 (settings.environment != "development").
"""

import asyncio
import sys

from sqlalchemy import text

from app.config import settings
from app.database import async_session_factory


async def reset(phone: str) -> None:
    if settings.environment != "development":
        print(f"[ABORT] environment={settings.environment} (development 아님). 안전을 위해 실행 거부.")
        sys.exit(1)

    async with async_session_factory() as db:
        rs = await db.execute(
            text("SELECT id FROM users WHERE phone = :p AND deleted_at IS NULL LIMIT 1"),
            {"p": phone},
        )
        row = rs.fetchone()
        if not row:
            print(f"[NOT FOUND] phone={phone} 에 매칭되는 user 없음.")
            return

        user_id = str(row.id)
        print(f"[OK] phone={phone}  user_id={user_id}")

        deletions = [
            ("guardian_consents", "guardian_id", user_id),
            ("child_consents",    "parent_id",   user_id),
            ("location_consents", "user_id",     user_id),
        ]
        for table, col, val in deletions:
            r = await db.execute(
                text(f"DELETE FROM {table} WHERE {col} = :v"),
                {"v": val},
            )
            print(f"  - {table:24s} deleted {r.rowcount} row(s)")

        await db.commit()
        print("[DONE] commit 완료. 모바일 앱에서 새로고침하면 ConsentScreen이 빈 상태로 다시 표시됩니다.")


def main() -> None:
    phone = sys.argv[1] if len(sys.argv) > 1 else "01033333333"
    asyncio.run(reset(phone))


if __name__ == "__main__":
    main()
