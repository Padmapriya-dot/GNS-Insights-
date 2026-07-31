# -*- coding: utf-8 -*-
import json
from pathlib import Path

p = Path(
    r"C:\Users\satee\.cursor\projects\c-Users-satee-OneDrive-Desktop-GNS-Insights"
    r"\agent-transcripts\81f04f90-ebd2-4299-a80c-4c0141c302f5"
    r"\81f04f90-ebd2-4299-a80c-4c0141c302f5.jsonl"
)
out = Path(r"c:\Users\satee\OneDrive\Desktop\GNS Insights\scratch\TemplateSettingsV2_from_transcript.jsx")

best_line = None
best_len = 0
best_contents = None

for i, line in enumerate(p.open(encoding="utf-8", errors="ignore")):
    if "TemplateSettingsV2.jsx" not in line:
        continue
    try:
        obj = json.loads(line)
    except Exception:
        continue

    def walk(o):
        results = []
        if isinstance(o, dict):
            name = o.get("name")
            inp = o.get("input") or {}
            path = str(inp.get("path", ""))
            if name == "Write" and "TemplateSettingsV2" in path:
                c = inp.get("contents") or ""
                if c:
                    results.append(("write", c))
            if name == "StrReplace" and "TemplateSettingsV2" in path:
                results.append(("str", inp))
            for v in o.values():
                results.extend(walk(v))
        elif isinstance(o, list):
            for v in o:
                results.extend(walk(v))
        return results

    content = obj.get("message", obj)
    for kind, payload in walk(content):
        if kind == "write" and len(payload) >= best_len:
            best_len = len(payload)
            best_contents = payload
            best_line = i

if best_contents:
    out.write_text(best_contents, encoding="utf-8")
    print(f"wrote write@{best_line} len={best_len} -> {out}")
else:
    print("no write found")
