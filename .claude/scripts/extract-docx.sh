#!/bin/bash
# Extract text from a .docx file.
#
# Usage:
#   ./extract-docx.sh <path-to-docx> [output.md]
#
# Primary: Python + python-docx (preferred, best quality)
# Fallback: unzip + sed (dependency-free, lower quality)

set -e

DOCX_PATH="$1"
OUTPUT_PATH="$2"

if [ -z "$DOCX_PATH" ]; then
    echo "Usage: $0 <path-to-docx> [output.md]"
    exit 1
fi

if [ ! -f "$DOCX_PATH" ]; then
    echo "ERROR: File not found: $DOCX_PATH" >&2
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY_SCRIPT="$SCRIPT_DIR/extract-docx.py"

# Try Python + python-docx first (preferred)
if command -v python >/dev/null 2>&1 && python -c "import docx" 2>/dev/null; then
    if [ -n "$OUTPUT_PATH" ]; then
        python "$PY_SCRIPT" "$DOCX_PATH" --output "$OUTPUT_PATH"
    else
        python "$PY_SCRIPT" "$DOCX_PATH"
    fi
    exit 0
fi

# Try python3 explicitly
if command -v python3 >/dev/null 2>&1 && python3 -c "import docx" 2>/dev/null; then
    if [ -n "$OUTPUT_PATH" ]; then
        python3 "$PY_SCRIPT" "$DOCX_PATH" --output "$OUTPUT_PATH"
    else
        python3 "$PY_SCRIPT" "$DOCX_PATH"
    fi
    exit 0
fi

# Fallback: unzip + sed (requires unzip)
echo "NOTE: python-docx not available, using unzip fallback (lower quality)" >&2
echo "      For best quality, install: pip install python-docx" >&2

if ! command -v unzip >/dev/null 2>&1; then
    echo "ERROR: Neither python-docx nor unzip is available." >&2
    echo "Install one of:" >&2
    echo "  pip install python-docx    (preferred)" >&2
    echo "  (or) ensure 'unzip' is on PATH" >&2
    exit 1
fi

# Extract document.xml and strip tags
EXTRACTED=$(unzip -p "$DOCX_PATH" word/document.xml 2>/dev/null | \
    sed 's/<w:p[^>]*>/\n\n/g' | \
    sed 's/<w:tr[^>]*>/\n| /g' | \
    sed 's/<w:tc[^>]*>/ | /g' | \
    sed 's/<[^>]*>//g' | \
    sed 's/  */ /g' | \
    sed 's/^ *//;s/ *$//')

BASENAME=$(basename "$DOCX_PATH" .docx)

if [ -n "$OUTPUT_PATH" ]; then
    mkdir -p "$(dirname "$OUTPUT_PATH")"
    {
        echo "# $BASENAME"
        echo ""
        echo "_Extracted from: \`$(basename "$DOCX_PATH")\` (unzip fallback mode, quality limited)_"
        echo ""
        echo "$EXTRACTED"
    } > "$OUTPUT_PATH"
    echo "Extracted to: $OUTPUT_PATH (fallback mode)" >&2
else
    echo "# $BASENAME"
    echo ""
    echo "_Extracted from: \`$(basename "$DOCX_PATH")\` (unzip fallback mode)_"
    echo ""
    echo "$EXTRACTED"
fi
