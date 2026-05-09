from uuid import UUID
from sqlalchemy.orm import Session
from backend.modules.messages.models import Message
from backend.modules.messages.schemas import MessageCreate

def list_messages(db: Session, project_id: UUID) -> list[Message]:
    return (
        db.query(Message)
        .filter(Message.project_id == project_id)
        .order_by(Message.created_at.asc())
        .all()
    )

def save_message(db: Session, project_id: UUID, data: MessageCreate) -> Message:
    message = Message(
        project_id=project_id,
        role=data.role,
        content=data.content,
        engine=data.engine,
        query=data.query,
        chart_data=data.chart_data,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message

def clear_history(db: Session, project_id: UUID) -> None:
    db.query(Message).filter(Message.project_id == project_id).delete()
    db.commit()
