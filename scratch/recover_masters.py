import json
from pathlib import Path

root = Path(
    r"C:\Users\satee\.cursor\projects\c-Users-satee-OneDrive-Desktop-GNS-Insights\agent-transcripts"
)
out_dir = Path(r"c:\Users\satee\OneDrive\Desktop\GNS Insights\scratch\recovered")
out_dir.mkdir(parents=True, exist_ok=True)

targets = [
    "Customers.jsx",
    "VendorManagement.jsx",
    "ProductsMaster.jsx",
    "CreateCustomer.jsx",
    "CreateVendor.jsx",
    "CreateItem.jsx",
]

best = {t: None for t in targets}

for p in root.rglob("*.jsonl"):
    with p.open(encoding="utf-8", errors="replace") as f:
        for line_no, line in enumerate(f, 1):
            if "Write" not in line:
                continue
            hits = [t for t in targets if t in line]
            if not hits:
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
                path = (inp.get("path") or "").replace("\\", "/")
                contents = inp.get("contents")
                if not contents:
                    continue
                for t in hits:
                    if path.endswith("/" + t) or path.endswith("\\" + t) or path.endswith(t):
                        size = len(contents)
                        cur = best[t]
                        if cur is None or size >= cur[0]:
                            best[t] = (size, line_no, p.name, contents)

for t, data in best.items():
    if not data:
        print("MISSING", t)
        continue
    dest = out_dir / t
    dest.write_text(data[3], encoding="utf-8")
    print(f"OK {t} {data[0]} chars from {data[2]}:{data[1]}")
