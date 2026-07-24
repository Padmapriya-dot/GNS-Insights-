"""Daily SQLite backup with optional Fernet encryption.

Usage (from backend/):
  python scripts/backup_sqlite.py

Env:
  DATABASE_URL          — default sqlite:///./smrt.db
  BACKUP_DIR            — default ./backups
  BACKUP_ENCRYPTION_KEY — optional Fernet key
  KEEP_BACKUPS          — number of backups to retain (default 14)

Schedule via Windows Task Scheduler or cron for daily runs.
"""

from __future__ import annotations

import hashlib
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))


def _sqlite_path_from_url(url: str) -> Path:
    raw = url.replace("sqlite:///", "", 1)
    path = Path(raw)
    if not path.is_absolute():
        path = (_BACKEND_ROOT / path).resolve()
    return path


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    import shutil

    from app.core.config import get_settings

    settings = get_settings()
    db_path = _sqlite_path_from_url(settings.database_url)
    if not db_path.exists():
        print(f"ERROR: database not found at {db_path}")
        return 1

    backup_dir = Path(os.getenv("BACKUP_DIR", str(_BACKEND_ROOT / "backups")))
    backup_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    dest = backup_dir / f"smrt_{stamp}.db"

    shutil.copy2(db_path, dest)
    checksum = _sha256(dest)
    (backup_dir / f"{dest.name}.sha256").write_text(
        f"{checksum}  {dest.name}\n", encoding="utf-8"
    )

    enc_key = os.getenv("BACKUP_ENCRYPTION_KEY", "").strip()
    if enc_key:
        try:
            from cryptography.fernet import Fernet
        except ImportError:
            print("ERROR: cryptography package required for encrypted backups")
            return 1
        try:
            fernet = Fernet(enc_key.encode("ascii"))
        except Exception:
            print("ERROR: BACKUP_ENCRYPTION_KEY is not a valid Fernet key")
            return 1
        enc_path = dest.with_suffix(".db.enc")
        enc_path.write_bytes(fernet.encrypt(dest.read_bytes()))
        dest.unlink(missing_ok=True)
        dest = enc_path
        print(f"Encrypted backup written: {dest}")
    else:
        print(f"Backup written: {dest}")

    print(f"SHA-256: {checksum}")

    keep = int(os.getenv("KEEP_BACKUPS", "14"))
    existing = sorted(
        list(backup_dir.glob("smrt_*.db")) + list(backup_dir.glob("smrt_*.db.enc")),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    for stale in existing[keep:]:
        checksum_side = backup_dir / f"{stale.name.replace('.enc', '')}.sha256"
        if not checksum_side.exists():
            checksum_side = backup_dir / f"{stale.name}.sha256"
        stale.unlink(missing_ok=True)
        checksum_side.unlink(missing_ok=True)
        print(f"Pruned old backup: {stale.name}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
