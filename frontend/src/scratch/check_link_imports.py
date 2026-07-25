import os
import re

src_dir = r"c:\Users\gogul\OneDrive\Desktop\AI\GNS-Insights\frontend\src"

missing_files = []

for root, _, files in os.walk(src_dir):
    for f in files:
        if f.endswith(".jsx") or f.endswith(".js"):
            filepath = os.path.join(root, f)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as file:
                content = file.read()
                if "<Link" in content:
                    # check if Link is imported
                    if "Link" not in content.split("import")[1:]: # simplistic check
                        # check exact import line
                        has_link_import = bool(re.search(r"import\s+.*?\bLink\b.*?from\s+[\"']react-router-dom[\"']", content))
                        if not has_link_import:
                            missing_files.append(filepath)

print("Files using <Link> without importing Link from react-router-dom:")
for m in missing_files:
    print(m)
