import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from backend.config import get_settings
from backend.exceptions import AppError
from backend.logger import configure_logging, get_logger
from backend.modules.auth.router import router as auth_router
from backend.modules.projects.router import router as projects_router
from backend.modules.messages.router import router as messages_router
from backend.modules.query.router import router as query_router
from backend.modules.query.task_registry import TaskRegistry

settings = get_settings()
configure_logging(debug=settings.debug)

log = get_logger(__name__)

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title=settings.app_name, debug=settings.debug)
app.state.limiter = limiter
app.state.task_registry = TaskRegistry()
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(request_id=request_id)

    log.info("request.started", method=request.method, path=request.url.path)
    response = await call_next(request)
    log.info("request.finished", method=request.method, path=request.url.path, status=response.status_code)

    response.headers["x-request-id"] = request_id
    return response


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    log.warning("app.error", code=exc.code, detail=exc.detail, path=request.url.path)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "code": exc.code},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    log.error("app.unhandled_error", error=str(exc), path=request.url.path, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "code": "INTERNAL_ERROR"},
    )


app.include_router(auth_router,     prefix="/auth",     tags=["auth"])
app.include_router(projects_router, prefix="/projects", tags=["projects"])
app.include_router(messages_router, prefix="/messages", tags=["messages"])
app.include_router(query_router,    prefix="/query",    tags=["query"])


@app.get("/health")
def health():
    return {"status": "ok", "app": settings.app_name}
