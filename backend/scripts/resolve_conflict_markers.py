import os
import re

src_dir = os.path.abspath('frontend/src')

def resolve_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    if '<<<<<<<' not in content:
        return False

    pattern = re.compile(
        r'<<<<<<< HEAD\r?\n(.*?)\r?\n=======\r?\n(.*?)\r?\n>>>>>>> [a-f0-9]+\r?\n',
        re.DOTALL
    )

    # For conflict markers, keep the HEAD (first) section if non-empty, otherwise second
    def replacer(match):
        head_text = match.group(1)
        remote_text = match.group(2)
        # Prefer head_text unless head_text is blank
        return head_text if head_text.strip() else remote_text

    new_content = pattern.sub(replacer, content)

    # Backup check: any remaining markers?
    if '<<<<<<<' in new_content:
        # Fallback regex without exact line breaks
        pattern2 = re.compile(r'<<<<<<<.*?\n(.*?)\n=======\n(.*?)\n>>>>>>>.*?\n', re.DOTALL)
        new_content = pattern2.sub(replacer, new_content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"Resolved conflict markers in: {filepath}")
    return True

fixed_count = 0
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.js', '.jsx', '.json', '.css', '.ts', '.tsx')):
            full_path = os.path.join(root, file)
            if resolve_file(full_path):
                fixed_count += 1

print(f"Finished resolving {fixed_count} files with conflict markers.")
