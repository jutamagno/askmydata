import uuid as _uuid
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
from backend.config import get_settings
from backend.logger import get_logger
from backend.modules.auth.models import User
from fastapi import HTTPException

settings = get_settings()
log = get_logger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "jti": str(_uuid.uuid4())},
        settings.secret_key,
        algorithm=settings.algorithm,
    )


def register_user(db: Session, email: str, password: str) -> User:
    if db.query(User).filter(User.email == email).first():
        log.warning("auth.register_failed", reason="email_exists", email=email)
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=email, hashed_password=hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    log.info("auth.registered", email=email)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.hashed_password:
        log.warning("auth.login_failed", reason="user_not_found", email=email)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(password, user.hashed_password):
        log.warning("auth.login_failed", reason="wrong_password", email=email)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    log.info("auth.login", email=email)
    return user


def get_or_create_google_user(db: Session, email: str, google_id: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        if not user.google_id:
            user.google_id = google_id
            db.commit()
        log.info("auth.google_login", email=email)
        return user
    user = User(email=email, google_id=google_id)
    db.add(user)
    db.commit()
    db.refresh(user)
    log.info("auth.google_registered", email=email)
    return user
