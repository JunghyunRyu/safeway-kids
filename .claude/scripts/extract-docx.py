#!/usr/bin/env python3
"""
Extract text from a .docx file, producing markdown-friendly output.

Usage:
    python extract-docx.py <path-to-docx>
    python extract-docx.py <path-to-docx> --output <path-to-md>

Requires:
    pip install python-docx

Fallback if python-docx is not available:
    Use .claude/scripts/extract-docx.sh (unzip-based, lower quality)
"""
import sys
import argparse
from pathlib import Path


WP_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'


def extract_with_python_docx(docx_path: Path) -> str:
    try:
        from docx import Document
    except ImportError:
        print("ERROR: python-docx not installed. Run: pip install python-docx", file=sys.stderr)
        print("Fallback: use .claude/scripts/extract-docx.sh (unzip-based)", file=sys.stderr)
        sys.exit(1)

    doc = Document(str(docx_path))
    lines = []

    lines.append(f"# {docx_path.stem}")
    lines.append("")
    lines.append(f"_Extracted from: `{docx_path.name}`_")
    lines.append("")

    for element in doc.element.body:
        tag = element.tag.split('}')[-1]
        if tag == 'p':
            text_nodes = element.findall(f'.//{{{WP_NS}}}t')
            text = ''.join(t.text or '' for t in text_nodes)
            if text.strip():
                # Detect heading style (best-effort)
                style_el = element.find(f'.//{{{WP_NS}}}pStyle')
                if style_el is not None:
                    style_val = style_el.get(f'{{{WP_NS}}}val', '')
                    if 'Heading1' in style_val or '1' in style_val:
                        lines.append(f"## {text}")
                        lines.append("")
                        continue
                    if 'Heading2' in style_val or '2' in style_val:
                        lines.append(f"### {text}")
                        lines.append("")
                        continue
                lines.append(text)
                lines.append("")
        elif tag == 'tbl':
            rows = element.findall(f'.//{{{WP_NS}}}tr')
            if not rows:
                continue
            table_rows = []
            for row in rows:
                cells = []
                for cell in row.findall(f'.//{{{WP_NS}}}tc'):
                    cell_texts = cell.findall(f'.//{{{WP_NS}}}t')
                    cell_text = ''.join(t.text or '' for t in cell_texts).strip()
                    cells.append(cell_text or ' ')
                table_rows.append(cells)
            if table_rows:
                # Render as markdown table
                header = table_rows[0]
                lines.append('| ' + ' | '.join(header) + ' |')
                lines.append('| ' + ' | '.join(['---'] * len(header)) + ' |')
                for row in table_rows[1:]:
                    # Pad or truncate to match header length
                    while len(row) < len(header):
                        row.append(' ')
                    lines.append('| ' + ' | '.join(row[:len(header)]) + ' |')
                lines.append("")

    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description='Extract text from a .docx file')
    parser.add_argument('docx_path', type=Path, help='Path to the .docx file')
    parser.add_argument('--output', '-o', type=Path, help='Output .md file (default: stdout)')
    args = parser.parse_args()

    if not args.docx_path.exists():
        print(f"ERROR: File not found: {args.docx_path}", file=sys.stderr)
        sys.exit(1)

    if args.docx_path.suffix.lower() != '.docx':
        print(f"WARNING: File does not have .docx extension: {args.docx_path}", file=sys.stderr)

    content = extract_with_python_docx(args.docx_path)

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(content, encoding='utf-8')
        print(f"Extracted to: {args.output}", file=sys.stderr)
    else:
        try:
            print(content)
        except UnicodeEncodeError:
            # Windows stdout fallback
            sys.stdout.buffer.write(content.encode('utf-8'))


if __name__ == '__main__':
    main()
