from pydantic import BaseModel, ConfigDict, Field


class CompanySettingsBase(BaseModel):
    company_name: str | None = None
    legal_name: str | None = None
    gstin: str | None = None
    pan: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    landmark: str | None = None
    city: str | None = None
    state: str | None = None
    state_code: str | None = None
    country: str | None = None
    pincode: str | None = None

    default_gst_pct: float | None = None
    prices_include_tax: bool = False

    invoice_prefix: str | None = None
    invoice_next_number: int = 1
    po_prefix: str | None = None
    so_prefix: str | None = None

    bank_name: str | None = None
    bank_account_number: str | None = None
    bank_ifsc: str | None = None
    bank_branch: str | None = None

    default_payment_terms_days: int | None = None
    payment_terms_note: str | None = None

    mfa_enabled: bool = False
    mfa_email_otp: bool = True
    mfa_sms_otp: bool = False
    mfa_authenticator: bool = False


class CompanySettingsUpdate(BaseModel):
    """All fields optional so any settings sub-page can patch its own slice."""

    company_name: str | None = None
    legal_name: str | None = None
    gstin: str | None = None
    pan: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    landmark: str | None = None
    city: str | None = None
    state: str | None = None
    state_code: str | None = None
    country: str | None = None
    pincode: str | None = None

    default_gst_pct: float | None = None
    prices_include_tax: bool | None = None

    invoice_prefix: str | None = None
    invoice_next_number: int | None = Field(None, ge=1)
    po_prefix: str | None = None
    so_prefix: str | None = None

    bank_name: str | None = None
    bank_account_number: str | None = None
    bank_ifsc: str | None = None
    bank_branch: str | None = None

    default_payment_terms_days: int | None = Field(None, ge=0)
    payment_terms_note: str | None = None

    mfa_enabled: bool | None = None
    mfa_email_otp: bool | None = None
    mfa_sms_otp: bool | None = None
    mfa_authenticator: bool | None = None


class CompanySettingsRead(CompanySettingsBase):
    id: int
    tenant_id: int
    model_config = ConfigDict(from_attributes=True)
