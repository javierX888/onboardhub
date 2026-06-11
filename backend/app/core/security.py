from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Backward compatibility: accept legacy "hashed_" scheme used earlier in the project
    if isinstance(hashed_password, str) and hashed_password.startswith("hashed_"):
        return hashed_password == f"hashed_{plain_password}"
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
