#!/usr/bin/env bash
set -euo pipefail
test -f examples/web-app/request.md
test -f examples/web-app/README.md
echo "web-app example is present and readable"
