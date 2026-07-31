from pydantic import BaseModel, ConfigDict, Field


class DispatchAddressCreate(BaseModel):
    gstin: str | None = None
    name: str = Field(min_length=1)
    address: str | None = None
    pincode: str | None = None
    city: str | None = None
    state: str | None = None
    country: str = "INDIA"
    is_default: bool = False


class DispatchAddressUpdate(BaseModel):
    gstin: str | None = None
    name: str | None = None
    address: str | None = None
    pincode: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    is_default: bool | None = None


class DispatchAddressRead(BaseModel):
    id: int
    tenant_id: int
    gstin: str | None = None
    name: str
    address: str | None = None
    pincode: str | None = None
    city: str | None = None
    state: str | None = None
    country: str = "INDIA"
    is_default: bool = False
    model_config = ConfigDict(from_attributes=True)
