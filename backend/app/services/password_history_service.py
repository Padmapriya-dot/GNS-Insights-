"""Password history helpers — block reuse of recent passwords."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.security import PasswordHistory
from app.models.user import User
from app.services.auth_service import verify_password

PASSWORD_HISTORY_LIMIT = 5
_MSG_REUSED = "Password was used previously. Choose a new password."


def assert_password_not_reused(
    db: Session,
    user: User,
    new_password: str,
    *,
    limit: int = PASSWORD_HISTORY_LIMIT,
) -> None:
    """Raise ValueError if new_password matches current or recent history."""
    if user.hashed_password and verify_password(new_password, user.hashed_password):
        raise ValueError(_MSG_REUSED)
    rows = list(
        db.scalars(
            select(PasswordHistory)
            .where(PasswordHistory.user_id == user.id)
            .order_by(PasswordHistory.id.desc())
            .limit(limit)
        ).all()
    )
    for row in rows:
        if verify_password(new_password, row.password_hash):
            raise ValueError(_MSG_REUSED)


def record_password_history(
    db: Session,
    user_id: int,
    password_hash: str,
    *,
    limit: int = PASSWORD_HISTORY_LIMIT,
) -> None:
    """Append hash and trim to the last ``limit`` entries."""
    db.add(PasswordHistory(user_id=user_id, password_hash=password_hash))
    db.flush()
    rows = list(
        db.scalars(
            select(PasswordHistory)
            .where(PasswordHistory.user_id == user_id)
            .order_by(PasswordHistory.id.desc())
        ).all()
    )
    for stale in rows[limit:]:
        db.delete(stale)
