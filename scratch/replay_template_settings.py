# -*- coding: utf-8 -*-
"""Replay Write + StrReplace ops for TemplateSettingsV2 from agent transcript."""
import json
from pathlib import Path

p = Path(
    r"C:\Users\satee\.cursor\projects\c-Users-satee-OneDrive-Desktop-GNS-Insights"
    r"\agent-transcripts\81f04f90-ebd2-4299-a80c-4c0141c302f5"
    r"\81f04f90-ebd2-4299-a80c-4c0141c302f5.jsonl"
)
out = Path(r"c:\Users\satee\OneDrive\Desktop\GNS Insights\scratch\TemplateSettingsV2_replayed.jsx")

content = None
ops = 0

def walk(o):
    results = []
    if isinstance(o, dict):
        name = o.get("name")
        inp = o.get("input") or {}
        path = str(inp.get("path", ""))
        if "TemplateSettingsV2" in path:
            if name == "Write":
                results.append(("write", inp.get("contents") or ""))
            elif name == "StrReplace":
                results.append(
                    (
                        "str",
                        inp.get("old_string") or "",
                        inp.get("new_string") or "",
                        bool(inp.get("replace_all")),
                    )
                )
        for v in o.values():
            results.extend(walk(v))
    elif isinstance(o, list):
        for v in o:
            results.extend(walk(v))
    return results

for i, line in enumerate(p.open(encoding="utf-8", errors="ignore")):
    if "TemplateSettingsV2.jsx" not in line:
        continue
    try:
        obj = json.loads(line)
    except Exception:
        continue
    for item in walk(obj.get("message", obj)):
        if item[0] == "write" and item[1]:
            content = item[1]
            ops += 1
            print(f"line {i}: WRITE len={len(content)}")
        elif item[0] == "str" and content is not None:
            old, new, replace_all = item[1], item[2], item[3]
            if not old:
                continue
            if old not in content:
                print(f"line {i}: STR miss old_len={len(old)}")
                continue
            if replace_all:
                content = content.replace(old, new)
            else:
                content = content.replace(old, new, 1)
            ops += 1
            print(f"line {i}: STR ok -> len={len(content)}")

if content:
    out.write_text(content, encoding="utf-8")
    print(f"DONE ops={ops} len={len(content)} -> {out}")
else:
    print("FAILED: no content")
