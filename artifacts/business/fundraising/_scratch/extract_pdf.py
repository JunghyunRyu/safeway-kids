"""One-shot PDF text extractor for 모두의 창업 2026 공고."""
import sys
from pathlib import Path
from pypdf import PdfReader

PDF = Path(
    r"C:\Users\forza\.claude\projects\C--jhryu-01-project-safeway-kids"
    r"\41774286-493c-41a3-8ca1-06ce3436f5fc\tool-results"
    r"\webfetch-1777391204294-zf0omz.pdf"
)
OUT = Path(r"C:\jhryu\01_project\safeway_kids\artifacts\business\fundraising\_scratch\modoo-2026-275-extracted.txt")

reader = PdfReader(str(PDF))
print(f"Total pages: {len(reader.pages)}", file=sys.stderr)

with OUT.open("w", encoding="utf-8") as f:
    for i, page in enumerate(reader.pages):
        f.write(f"\n========== Page {i+1} ==========\n")
        try:
            f.write(page.extract_text() or "[empty]")
        except Exception as e:
            f.write(f"[extraction error: {e}]")
        f.write("\n")

print(f"Wrote: {OUT}", file=sys.stderr)
print(f"Size: {OUT.stat().st_size} bytes", file=sys.stderr)
