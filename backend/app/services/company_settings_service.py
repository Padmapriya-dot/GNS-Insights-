from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.company_settings import CompanySettings
from app.models.tenant import Tenant
from app.schemas.company_settings import CompanySettingsRead, CompanySettingsUpdate
from app.utils.field_crypto import decrypt_field, encrypt_field

_SENSITIVE_FIELDS = ("bank_account_number", "bank_ifsc")


def get_or_create_settings(db: Session, tenant_id: int) -> CompanySettings:
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
        po_prefix="PO-",
        so_prefix="SO-",
        invoice_next_number=1,
    )
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def to_settings_read(settings: CompanySettings) -> CompanySettingsRead:
    """Build API read model with sensitive fields decrypted (does not mutate ORM)."""
    data = CompanySettingsRead.model_validate(settings).model_dump()
    for field in _SENSITIVE_FIELDS:
        raw = data.get(field)
        try:
            data[field] = decrypt_field(raw)
        except Exception:
            pass
    return CompanySettingsRead(**data)


def update_settings(
    db: Session, tenant_id: int, payload: CompanySettingsUpdate
) -> CompanySettings:
    settings = get_or_create_settings(db, tenant_id)
    data = payload.model_dump(exclude_unset=True)
    for field in _SENSITIVE_FIELDS:
        if field in data and data[field] is not None:
            data[field] = encrypt_field(data[field])
    for field, value in data.items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)
    return settings
