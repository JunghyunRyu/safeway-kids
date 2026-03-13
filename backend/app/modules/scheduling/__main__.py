"""CLI entry point: python -m app.modules.scheduling [--date YYYY-MM-DD]"""

import argparse
import asyncio
import logging
from datetime import date

from app.modules.scheduling.scheduler import run_pipeline_cli

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="SAFEWAY KIDS daily schedule pipeline",
    )
    parser.add_argument(
        "--date", type=date.fromisoformat, default=None,
        help="Target date (YYYY-MM-DD), defaults to tomorrow",
    )
    args = parser.parse_args()

    asyncio.run(run_pipeline_cli(args.date))


if __name__ == "__main__":
    main()
