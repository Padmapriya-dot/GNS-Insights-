import json
from pathlib import Path

root = Path(
    r"C:\Users\satee\.cursor\projects\c-Users-satee-OneDrive-Desktop-GNS-Insights\agent-transcripts"
)
out_dir = Path(r"c:\Users\satee\OneDrive\Desktop\GNS Insights\scratch\recovered")
out_dir.mkdir(parents=True, exist_ok=True)
target = "TemplateSettingsV2.jsx"
best = None  # (size, line, path, contents)

for p in root.rglob("*.jsonl"):
    with p.open(encoding="utf-8", errors="replace") as f:
        for line_no, line in enumerate(f, 1):
            if target not in line or "Write" not in line:
                continue
            try:
                obj = json.loads(line)
            except Exception:
                continue
            content = (obj.get("message") or {}).get("content")
            if not isinstance(content, list):
                continue
            for block in content:
                if not isinstance(block, dict):
                    continue
                if block.get("type") != "tool_use" or block.get("name") != "Write":
                    continue
                inp = block.get("input") or {}
                path = inp.get("path") or ""
                contents = inp.get("contents")
                if not contents or target not in path.replace("\\", "/"):
                    continue
                size = len(contents)
                if best is None or size > best[0]:
                    best = (size, line_no, str(p), contents)
                    print(f"candidate {size} chars @ {p.name}:{line_no}")

if best:
    dest = out_dir / "TemplateSettingsV2.jsx"
    dest.write_text(best[3], encoding="utf-8")
    print(f"BEST {best[0]} chars saved")
else:
    print("NONE")
