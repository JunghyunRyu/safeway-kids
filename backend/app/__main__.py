"""Allow running seed with: python -m app seed"""

import sys

if len(sys.argv) > 1 and sys.argv[1] == "seed":
    from app.seed import main
    main()
else:
    print("Usage: python -m app seed")
    print("  seed  — Create demo data and run daily pipeline")
