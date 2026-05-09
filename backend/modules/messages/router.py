from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.modules.auth.dependencies import get_current_user
from backend.modules.auth.models import User
from backend.modules.projects.service import get_project
from backend.modules.messages import service
from backend.modules.messages.schemas import MessageOut

router = APIRouter()


@router.get("/{project_id}", response_model=list[MessageOut])
def get_history(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_project(db, project_id, current_user.id)
    return service.list_messages(db, project_id)


@router.delete("/{project_id}", status_code=204)
def clear_history(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_project(db, project_id, current_user.id)
    service.clear_history(db, project_id)
