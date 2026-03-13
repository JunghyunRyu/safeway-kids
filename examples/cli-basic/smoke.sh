#!/usr/bin/env bash
set -euo pipefail
test -f examples/cli-basic/request.md
test -f examples/cli-basic/README.md
echo "cli-basic example is present and readable"
