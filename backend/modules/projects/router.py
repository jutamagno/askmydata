from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.modules.auth.dependencies import get_current_user
from backend.modules.auth.models import User
from backend.modules.projects import service
from backend.modules.projects.schemas import CsvFileOut, ProjectCreate, ProjectOut, ProjectSummary

router = APIRouter()


@router.post("/", response_model=ProjectOut)
def create_project(
    body: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_project(db, current_user.id, body.name)


@router.get("/", response_model=list[ProjectSummary])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = service.list_projects(db, current_user.id)
    return [
        ProjectSummary(
            id=p.id,
            name=p.name,
            updated_at=p.updated_at,
            csv_count=len(p.csv_files),
        )
        for p in projects
    ]


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_project(db, project_id, current_user.id)


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service.delete_project(db, project_id, current_user.id)


@router.post("/{project_id}/upload", response_model=CsvFileOut)
async def upload_csv(
    project_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await service.upload_csv(db, project_id, current_user.id, file)
