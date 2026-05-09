import asyncio
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.database import get_db
from backend.modules.auth.dependencies import get_current_user
from backend.modules.auth.models import User
from backend.modules.query.schemas import QueryRequest, QueryResponse
from backend.modules.query.service import handle_query
from backend.modules.query.service_stream import handle_query_stream, handle_query_bg

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/", response_model=QueryResponse)
@limiter.limit("30/minute")
async def query(
    request: Request,
    body: QueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await handle_query(
        db=db,
        project_id=body.project_id,
        csv_file_ids=body.csv_file_ids,
        question=body.question,
    )


@router.post("/stream")
@limiter.limit("30/minute")
async def query_stream(
    request: Request,
    body: QueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return StreamingResponse(
        handle_query_stream(
            db=db,
            project_id=body.project_id,
            csv_file_ids=body.csv_file_ids,
            question=body.question,
        ),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/task")
@limiter.limit("30/minute")
async def create_task(
    request: Request,
    body: QueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start a background query task and return its ID immediately."""
    registry = request.app.state.task_registry
    task_id = str(uuid.uuid4())
    registry.create(task_id)

    asyncio.create_task(
        handle_query_bg(
            task_id=task_id,
            db=db,
            project_id=body.project_id,
            csv_file_ids=body.csv_file_ids,
            question=body.question,
            registry=registry,
        )
    )

    return {"task_id": task_id}


@router.get("/task/{task_id}/stream")
async def stream_task(task_id: str, request: Request):
    """SSE endpoint: replay all buffered events then stream live until done."""
    registry = request.app.state.task_registry
    buf = registry.get(task_id)
    if buf is None:
        raise HTTPException(status_code=404, detail="Task not found or expired")

    async def _gen():
        async for event in buf.stream_from(0):
            if await request.is_disconnected():
                return  # client left; buffer stays so they can reconnect
            yield event
        # Only clean up after the full stream was delivered to this client
        registry.remove(task_id)

    return StreamingResponse(
        _gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
