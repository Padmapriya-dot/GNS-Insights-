from pathlib import Path
import json


def load_patch(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    if text.startswith('"'):
        text = json.loads(text)
    return text


def reconstruct(patch_path: str, out_path: str) -> None:
    text = load_patch(Path(patch_path))
    lines = text.splitlines()
    out = []
    in_hunk = False
    for line in lines:
        if line.startswith("@@"):
            in_hunk = True
            continue
        if not in_hunk:
            continue
        if line.startswith("+") and not line.startswith("+++"):
            out.append(line[1:])
        elif line.startswith("-") and not line.startswith("---"):
            continue
        elif line.startswith("***"):
            continue
        elif line.startswith(" "):
            out.append(line[1:])
    Path(out_path).write_text("\n".join(out) + "\n", encoding="utf-8")
    print(out_path, "lines", len(out))


reconstruct("scratch/recovered/customers_patch.txt", "scratch/recovered/Customers.jsx")
reconstruct("scratch/recovered/patch_2810.txt", "scratch/recovered/VendorManagement.jsx")
reconstruct("scratch/recovered/patch_2828.txt", "scratch/recovered/CreateVendor.jsx")
reconstruct("scratch/recovered/patch_create_customer.txt", "scratch/recovered/CreateCustomer.jsx")
print("done")
