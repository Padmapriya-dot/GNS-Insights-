"""
Run once to delete all seeded/fake journal entries from the database.
Only entries matching the seed pattern (JE-2026-10xx) are removed.
User-created entries (JV-YYYY-NNNN format from the form) are kept.

Usage:
    cd backend
    python clear_seeded_journal_entries.py
"""
from app.core.database import SessionLocal
from app.models.accounts import JournalEntry, JournalLeg
from sqlalchemy import select, delete

db = SessionLocal()
try:
    # Find all seeded entries — seed pattern is "JE-2026-1000" through "JE-2026-1009"
    seeded = list(db.scalars(
        select(JournalEntry).where(JournalEntry.entry_number.like("JE-2026-1%"))
    ).all())

    if not seeded:
        print("No seeded journal entries found.")
    else:
        ids = [e.id for e in seeded]
        db.execute(delete(JournalLeg).where(JournalLeg.entry_id.in_(ids)))
        db.execute(delete(JournalEntry).where(JournalEntry.id.in_(ids)))
        db.commit()
        print(f"Deleted {len(ids)} seeded journal entries and their legs.")
except Exception as e:
    db.rollback()
    print(f"Error: {e}")
finally:
    db.close()
