"""Development DB reset: drop all tables, recreate from models, stamp alembic."""
import asyncio
from sqlalchemy import text
from app.database import engine, Base

# Import all models so Base.metadata knows about them
import app.modules.auth.models  # noqa: F401
import app.modules.academy_management.models  # noqa: F401
import app.modules.student_management.models  # noqa: F401
import app.modules.scheduling.models  # noqa: F401
import app.modules.vehicle_telemetry.models  # noqa: F401
import app.modules.billing.models  # noqa: F401
import app.modules.compliance.models  # noqa: F401
import app.modules.escort.models  # noqa: F401
import app.modules.admin.models  # noqa: F401
import app.modules.contact.models  # noqa: F401


async def reset():
    async with engine.begin() as conn:
        # Drop all tables
        await conn.execute(text("DROP SCHEMA public CASCADE"))
        await conn.execute(text("CREATE SCHEMA public"))
        print("Schema reset done.")

        # Create all tables from SQLAlchemy models
        await conn.run_sync(Base.metadata.create_all)
        tables = list(Base.metadata.tables.keys())
        print(f"Created {len(tables)} tables: {tables}")

        # Stamp alembic version
        await conn.execute(text(
            "CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) NOT NULL)"
        ))
        await conn.execute(text("DELETE FROM alembic_version"))
        await conn.execute(text(
            "INSERT INTO alembic_version (version_num) VALUES ('8723a985bcbb')"
        ))
        print("Alembic stamped at head (8723a985bcbb).")


if __name__ == "__main__":
    asyncio.run(reset())
