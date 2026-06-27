#!/usr/bin/env python3
"""
split_script.py — turn one EasyEDA Pro standalone .js script into a self-describing
folder, with ZERO extra LLM tokens.

The Coder Agent already emits a fully-commented, runnable .js script. Rather than
spending model tokens to *also* generate a description and a parts list, this tool
derives both mechanically:

  scripts/<slug>/
    script.js   - the runnable script, verbatim (still valid to paste into EasyEDA)
    README.md   - "what this script is for", built from the script's own comments
    parts.json  - the LCSC parts list, extracted from getByLcscIds([...]) — editable

`parts.json` is the editable source of truth for the components. A later "update"
workflow can read it back, swap LCSC ids/values, and regenerate the script.

Usage:
    python3 split_script.py --idea "blink an LED at 3V" --script-file script.js --out scripts
    cat script.js | python3 split_script.py --idea "..." --out scripts   # script on stdin
"""

import argparse
import json
import re
import sys
from pathlib import Path


def slugify(text: str) -> str:
    """Match the bash slug logic: lowercase, non-alnum -> '-', trim, fallback."""
    s = text.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    return s or "circuit"


def extract_lcsc_ids(script: str) -> list[str]:
    """Pull LCSC part numbers out of every getByLcscIds([...]) call, in order, deduped."""
    ids: list[str] = []
    for call in re.findall(r"getByLcscIds\s*\(\s*\[(.*?)\]", script, re.DOTALL):
        for part in re.findall(r"""['"]([Cc]\d+)['"]""", call):
            up = part.upper()
            if up not in ids:
                ids.append(up)
    return ids


def guess_ref_and_role(script: str, lcsc: str) -> tuple[str, str]:
    """
    Best-effort: find the comment on/near the line that .find()s this part, e.g.
        const resistor = devices.find(... === 'C21190');  // R1 100 ohm
    Falls back to empty strings the user can fill in.
    """
    ref, role = "", ""
    for line in script.splitlines():
        if lcsc in line and ".find" in line:
            # variable name -> rough role hint
            m = re.search(r"const\s+(\w+)\s*=", line)
            if m:
                role = m.group(1)
            # trailing comment, if any
            c = re.search(r"//\s*(.+)$", line)
            if c:
                role = c.group(1).strip()
            break
    # reference designator (R1, D1, U1...) referenced anywhere near the id's usage
    m = re.search(r"\b([RDUCLQ]\d+)\b", role)
    if m:
        ref = m.group(1)
    return ref, role


def extract_header_purpose(script: str) -> str:
    """The leading block of // comment lines describes what the script builds."""
    lines = []
    for raw in script.splitlines():
        line = raw.strip()
        if line.startswith("//"):
            lines.append(line.lstrip("/ ").rstrip())
        elif line == "":
            if lines:  # blank line after the header block ends it
                break
        else:
            break
    return "\n".join(lines).strip()


def build_parts(script: str) -> list[dict]:
    parts = []
    for lcsc in extract_lcsc_ids(script):
        ref, role = guess_ref_and_role(script, lcsc)
        parts.append(
            {
                "lcsc": lcsc,
                "ref": ref,
                "description": role,
                "value": "",
                "qty": 1,
            }
        )
    return parts


def render_readme(idea: str, slug: str, purpose: str, parts: list[dict]) -> str:
    title = purpose.splitlines()[0] if purpose else idea
    out = [f"# {title}", ""]
    out.append(f"**Idea:** {idea}", )
    out.append("")
    if purpose:
        out.append("## What this script builds")
        out.append("")
        out.append(purpose)
        out.append("")
    if parts:
        out.append("## Parts list")
        out.append("")
        out.append("Edit `parts.json` to change components; it is the source of truth")
        out.append("for the (planned) regenerate-on-update workflow.")
        out.append("")
        out.append("| Ref | LCSC | Description | Value | Qty |")
        out.append("| --- | --- | --- | --- | --- |")
        for p in parts:
            out.append(
                f"| {p['ref'] or '—'} | {p['lcsc']} | {p['description'] or '—'} "
                f"| {p['value'] or '—'} | {p['qty']} |"
            )
        out.append("")
    out.append("## How to run in EasyEDA Pro")
    out.append("")
    out.append("1. Open the EasyEDA Pro desktop app")
    out.append("2. Make sure **Schematic 1 › P1** is the active tab")
    out.append("3. Go to **Settings → Extensions → Standalone Script**")
    out.append("4. Paste the contents of `script.js` and click **Run**")
    out.append('5. Click **Place Circuit** in the confirmation dialog')
    out.append("")
    out.append("_Generated mechanically from `script.js` by `split_script.py` — no extra model tokens._")
    out.append("")
    return "\n".join(out)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--idea", required=True, help="plain-language circuit idea")
    ap.add_argument("--script-file", help="path to the .js script (else read stdin)")
    ap.add_argument("--out", default="scripts", help="output root dir (default: scripts)")
    args = ap.parse_args()

    if args.script_file:
        script = Path(args.script_file).read_text(encoding="utf-8")
    else:
        script = sys.stdin.read()

    if not script.strip():
        print("error: empty script", file=sys.stderr)
        return 1

    slug = slugify(args.idea)
    purpose = extract_header_purpose(script)
    parts = build_parts(script)

    folder = Path(args.out) / slug
    folder.mkdir(parents=True, exist_ok=True)

    (folder / "script.js").write_text(script, encoding="utf-8")
    (folder / "parts.json").write_text(
        json.dumps({"idea": args.idea, "slug": slug, "parts": parts}, indent=2) + "\n",
        encoding="utf-8",
    )
    (folder / "README.md").write_text(
        render_readme(args.idea, slug, purpose, parts), encoding="utf-8"
    )

    print(f"Wrote {folder}/ (script.js, README.md, parts.json — {len(parts)} parts)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
