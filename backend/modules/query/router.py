from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.modules.auth.dependencies import get_current_user
from backend.modules.auth.models import User
from backend.modules.query.schemas import QueryRequest, QueryResponse
from backend.modules.query.service import handle_query

router = APIRouter()


@router.post("/", response_model=QueryResponse)
async def query(
    body: QueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await handle_query(
        db=db,
        project_id=body.project_id,
        csv_file_id=body.csv_file_id,
        question=body.question,
    )
