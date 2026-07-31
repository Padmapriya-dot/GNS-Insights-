import json
from pathlib import Path

p = Path(
    r"C:\Users\satee\.cursor\projects\c-Users-satee-OneDrive-Desktop-GNS-Insights"
    r"\agent-transcripts\81f04f90-ebd2-4299-a80c-4c0141c302f5"
    r"\81f04f90-ebd2-4299-a80c-4c0141c302f5.jsonl"
)
targets = [
    "InvoiceSettingsV2.jsx",
    "AccountingReportsV2.jsx",
    "BalanceSheetV2.jsx",
    "AuditTrailV2.jsx",
    "BulkExportReportV2.jsx",
    "ReportViewerV2.jsx",
    "RestoreDeletedDocV2.jsx",
    "TemplateSettingsV2.jsx",
    "FormatSettingsV2.jsx",
    "ProfitLossV2.jsx",
]
out_dir = Path(r"c:\Users\satee\OneDrive\Desktop\GNS Insights\scratch\recovered")
out_dir.mkdir(parents=True, exist_ok=True)

latest = {t: None for t in targets}

with p.open(encoding="utf-8", errors="replace") as f:
    for line_no, line in enumerate(f, 1):
        if "Write" not in line:
            continue
        hit = [t for t in targets if t in line]
        if not hit:
            continue
        try:
            obj = json.loads(line)
        except Exception:
            continue
        msg = obj.get("message") or {}
        content = msg.get("content")
        if not isinstance(content, list):
            continue
        for block in content:
            if not isinstance(block, dict):
                continue
            if block.get("type") != "tool_use":
                continue
            if block.get("name") != "Write":
                continue
            inp = block.get("input") or {}
            path = inp.get("path") or ""
            contents = inp.get("contents")
            if not contents:
                continue
            for t in hit:
                if t in path.replace("\\", "/"):
                    latest[t] = (line_no, path, contents)

for t, data in latest.items():
    if not data:
        print(f"MISSING {t}")
        continue
    line_no, path, contents = data
    dest = out_dir / t
    dest.write_text(contents, encoding="utf-8")
    print(f"OK {t} from line {line_no} ({len(contents)} chars) -> {dest}")
