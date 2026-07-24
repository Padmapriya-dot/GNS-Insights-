from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.document import Document
from app.schemas.document import DocumentCreate, DocumentUpdate


def create_document(db: Session, payload: DocumentCreate) -> Document:
    data = payload.model_dump()
    tenant_id = data.get("tenant_id")
    if not tenant_id:
        raise ValueError("tenant_id is required")
    doc = Document(**data)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def list_documents(
    db: Session,
    tenant_id: int,
    doc_type: str | None = None,
) -> list[Document]:
    stmt = select(Document).where(Document.tenant_id == tenant_id)
    if doc_type:
        dt = doc_type.lower()
        stmt = stmt.where(or_(Document.doc_type == doc_type, Document.doc_type == dt))
    stmt = stmt.order_by(Document.created_at.desc())
    return list(db.scalars(stmt).all())


def get_document(db: Session, document_id: int, tenant_id: int | None = None) -> Document | None:
    doc = db.get(Document, document_id)
    if not doc:
        return None
    if tenant_id is not None and doc.tenant_id != tenant_id:
        return None
    return doc


def update_document(
    db: Session,
    document_id: int,
    tenant_id: int | None = None,
    payload: DocumentUpdate = None,
) -> Document | None:
    doc = get_document(db, document_id, tenant_id)
    if not doc:
        return None
    data = payload.model_dump(exclude_unset=True) if payload else {}
    # Never allow tenant reassignment via update
    data.pop("tenant_id", None)
    for key, value in data.items():
        setattr(doc, key, value)
    db.commit()
    db.refresh(doc)
    return doc


def delete_document(db: Session, document_id: int, tenant_id: int | None = None) -> bool:
    doc = get_document(db, document_id, tenant_id)
    if not doc:
        return False
    db.delete(doc)
    db.commit()
    return True
