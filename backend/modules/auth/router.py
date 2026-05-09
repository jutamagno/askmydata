from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from backend.database import get_db
from backend.config import get_settings
from backend.modules.auth import service
from backend.modules.auth.schemas import RegisterRequest, LoginRequest, TokenResponse, UserOut
from backend.modules.auth.dependencies import get_current_user
from backend.modules.auth.models import User

settings = get_settings()
router = APIRouter()

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

@router.post("/register", response_model=TokenResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    user = service.register_user(db, body.email, body.password)
    token = service.create_access_token(str(user.id))
    return TokenResponse(access_token=token)

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = service.authenticate_user(db, body.email, body.password)
    token = service.create_access_token(str(user.id))
    return TokenResponse(access_token=token)

@router.get("/google")
async def google_login(request: Request):
    return await oauth.google.authorize_redirect(request, settings.google_redirect_uri)

@router.get("/google/callback", response_model=TokenResponse)
async def google_callback(request: Request, db: Session = Depends(get_db)):
    google_token = await oauth.google.authorize_access_token(request)
    user_info = google_token.get("userinfo")
    user = service.get_or_create_google_user(db, user_info["email"], user_info["sub"])
    token = service.create_access_token(str(user.id))
    return TokenResponse(access_token=token)

@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
