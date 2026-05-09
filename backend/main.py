from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import get_settings
from backend.modules.auth.router import router as auth_router
from backend.modules.projects.router import router as projects_router
from backend.modules.messages.router import router as messages_router
from backend.modules.query.router import router as query_router

settings = get_settings()

app = FastAPI(title=settings.app_name, debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,     prefix="/auth",     tags=["auth"])
app.include_router(projects_router, prefix="/projects", tags=["projects"])
app.include_router(messages_router, prefix="/messages", tags=["messages"])
app.include_router(query_router,    prefix="/query",    tags=["query"])

@app.get("/health")
def health():
    return {"status": "ok", "app": settings.app_name}
