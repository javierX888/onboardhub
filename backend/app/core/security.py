import bcrypt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Backward compatibility: accept legacy "hashed_" scheme used earlier in the project
    if isinstance(hashed_password, str) and hashed_password.startswith("hashed_"):
        return hashed_password == f"hashed_{plain_password}"
    try:
        hashed_bytes = hashed_password.encode('utf-8') if isinstance(hashed_password, str) else hashed_password
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_bytes)
    except Exception as e:
        print(f"Error in verify_password: {e}")
        return False


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
