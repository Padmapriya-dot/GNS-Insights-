from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.utils.sanitize import sanitize_text


class DocumentBase(BaseModel):
    tenant_id: int | None = None
    doc_type: str = Field(..., min_length=1, max_length=64)
    title: str = Field(..., min_length=1, max_length=255)
    file_path: str | None = Field(None, max_length=1024)
    file_name: str | None = Field(None, max_length=255)
    file_size: int | None = Field(0, ge=0, le=50 * 1024 * 1024)
    reference_type: str | None = Field(None, max_length=64)
    reference_id: int | None = None
    department: str | None = Field("Procurement", max_length=128)
    version: str | None = Field("v1.0", max_length=32)
    description: str | None = Field(None, max_length=4000)
    uploaded_by: str | None = Field(None, max_length=255)

    @field_validator("title", "doc_type", "description", "department", "uploaded_by", "file_name")
    @classmethod
    def sanitize_fields(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return sanitize_text(value, max_length=4000)

    @field_validator("file_path")
    @classmethod
    def sanitize_file_path(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = sanitize_text(value, max_length=1024)
        if ".." in cleaned or cleaned.startswith(("/", "\\")):
            raise ValueError("Invalid file path")
        return cleaned


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    doc_type: str | None = Field(None, min_length=1, max_length=64)
    title: str | None = Field(None, min_length=1, max_length=255)
    file_path: str | None = Field(None, max_length=1024)
    file_name: str | None = Field(None, max_length=255)
    file_size: int | None = Field(None, ge=0, le=50 * 1024 * 1024)
    reference_type: str | None = Field(None, max_length=64)
    reference_id: int | None = None
    department: str | None = Field(None, max_length=128)
    version: str | None = Field(None, max_length=32)
    description: str | None = Field(None, max_length=4000)
    uploaded_by: str | None = Field(None, max_length=255)

    @field_validator("title", "doc_type", "description", "department", "uploaded_by", "file_name")
    @classmethod
    def sanitize_fields(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return sanitize_text(value, max_length=4000)

    @field_validator("file_path")
    @classmethod
    def sanitize_file_path(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = sanitize_text(value, max_length=1024)
        if ".." in cleaned or cleaned.startswith(("/", "\\")):
            raise ValueError("Invalid file path")
        return cleaned


class DocumentRead(DocumentBase):
    id: int
    created_at: object | None = Field(default=None)
    updated_at: object | None = Field(default=None)
    model_config = ConfigDict(from_attributes=True)
