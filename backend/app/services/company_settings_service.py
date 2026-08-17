import json
import logging

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.company_settings import CompanySettings
from app.models.tenant import Tenant
from app.schemas.company_settings import CompanySettingsRead, CompanySettingsUpdate
from app.utils.field_crypto import decrypt_field, encrypt_field

logger = logging.getLogger(__name__)

_SENSITIVE_FIELDS = ("bank_account_number", "bank_ifsc")


def get_or_create_settings(db: Session, tenant_id: int) -> CompanySettings:
    """Return settings for tenant. Flush only — never commit (callers own the txn)."""
    try:
        settings = db.scalars(
            select(CompanySettings).where(CompanySettings.tenant_id == tenant_id)
        ).first()
        if settings:
            return settings

        tenant = db.get(Tenant, tenant_id)
        settings = CompanySettings(
            tenant_id=tenant_id,
            company_name=tenant.name if tenant else None,
            invoice_prefix="INV-",
            quotation_prefix="QUO-",
            purchase_prefix="PUR-",
            po_prefix="PO-",
            so_prefix="SO-",
            invoice_next_number=1,
            quotation_next_number=1,
            purchase_next_number=1,
        )
        db.add(settings)
        db.flush()
        db.refresh(settings)
        return settings
    except SQLAlchemyError as exc:
        logger.exception(
            "Database error initialising company settings for tenant_id=%s: %s", tenant_id, exc
        )
        try:
            db.rollback()
        except Exception:
            pass
        raise HTTPException(
            status_code=503,
            detail="Database connection unavailable. Unable to load company settings.",
        ) from exc
    except Exception as exc:
        logger.exception(
            "Unexpected error initialising company settings for tenant_id=%s: %s", tenant_id, exc
        )
        try:
            db.rollback()
        except Exception:
            pass
        raise HTTPException(
            status_code=500,
            detail="Failed to load company settings.",
        ) from exc


def _parse_custom_fields(raw: str | None) -> list[dict] | None:
    if not raw:
        return None
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, list) else None
    except Exception:
        return None


def to_settings_read(settings: CompanySettings) -> CompanySettingsRead:
    """Build API read model with sensitive fields decrypted (does not mutate ORM)."""
    from pydantic import ValidationError

    try:
        data = {
            c.name: getattr(settings, c.name)
            for c in settings.__table__.columns
            if c.name != "custom_fields_json"
        }
        data["custom_fields"] = _parse_custom_fields(settings.custom_fields_json)
        for field in _SENSITIVE_FIELDS:
            raw = data.get(field)
            try:
                data[field] = decrypt_field(raw)
            except Exception:
                pass
        return CompanySettingsRead.model_validate(data)
    except ValidationError as exc:
        logger.exception(
            "Validation error building company settings response for tenant_id=%s: %s",
            getattr(settings, "tenant_id", "unknown"),
            exc,
        )
        raise HTTPException(
            status_code=422,
            detail="Company settings contain invalid or corrupted data. Please contact your administrator.",
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(
            "Unexpected error building company settings response for tenant_id=%s: %s",
            getattr(settings, "tenant_id", "unknown"),
            exc,
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to read company settings.",
        ) from exc


def update_settings(
    db: Session, tenant_id: int, payload: CompanySettingsUpdate
) -> CompanySettings:
    settings = get_or_create_settings(db, tenant_id)
    data = payload.model_dump(exclude_unset=True)
    if "custom_fields" in data:
        fields = data.pop("custom_fields")
        data["custom_fields_json"] = (
            json.dumps(fields) if fields is not None else None
        )
    for field in _SENSITIVE_FIELDS:
        if field in data and data[field] is not None:
            data[field] = encrypt_field(data[field])
    for field, value in data.items():
        setattr(settings, field, value)
    try:
        db.commit()
        db.refresh(settings)
        return settings
    except SQLAlchemyError as exc:
        logger.exception(
            "Database error committing company settings update for tenant_id=%s: %s",
            tenant_id, exc,
        )
        try:
            db.rollback()
        except Exception:
            pass
        raise HTTPException(
            status_code=503,
            detail="Database connection unavailable. Company settings update was not saved.",
        ) from exc
    except Exception as exc:
        logger.exception(
            "Unexpected error committing company settings update for tenant_id=%s: %s",
            tenant_id, exc,
        )
        try:
            db.rollback()
        except Exception:
            pass
        raise HTTPException(
            status_code=500,
            detail="Failed to save company settings.",
        ) from exc
