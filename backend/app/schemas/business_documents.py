from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class BusinessDocumentCreate(BaseModel):
    tenant_id: int | None = None
    module: str = "sales"
    doc_type: str
    document_number: str | None = None
    party_name: str | None = None
    document_date: date | None = None
    due_date: date | None = None
    amount: float = 0
    status: str = "draft"
    notes: str | None = None
    meta: dict[str, Any] | None = None


class BusinessDocumentRead(BaseModel):
    id: int
    tenant_id: int
    module: str
    doc_type: str
    document_number: str
    party_name: str | None = None
    document_date: date
    due_date: date | None = None
    amount: float = 0
    status: str = "draft"
    notes: str | None = None
    meta: dict[str, Any] | None = None
    model_config = ConfigDict(from_attributes=True)


class BusinessDocumentListResponse(BaseModel):
    items: list[BusinessDocumentRead] = []
    total: int = 0


class EwaybillLoginRequest(BaseModel):
    gstin: str
    username: str
    password: str


class EwaybillLoginResponse(BaseModel):
    success: bool
    message: str
    connected: bool = False
    gstin: str | None = None


class EwaybillStatusRead(BaseModel):
    connected: bool = False
    gstin: str | None = None
    username: str | None = None
    last_login_at: datetime | None = None


class DigitalSignatureStatusRead(BaseModel):
    is_setup: bool = False
    promo_credits: int = 3
    signatory_name: str | None = None
    aadhaar_masked: str | None = None


class DigitalSignatureSetupRequest(BaseModel):
    signatory_name: str
    aadhaar_last4: str = Field(min_length=4, max_length=4)


class FeatureSettingRead(BaseModel):
    key: str
    value: Any = None


class FeatureSettingUpdate(BaseModel):
    value: Any = None
