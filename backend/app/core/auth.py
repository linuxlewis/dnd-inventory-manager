import bcrypt


def verify_passphrase(plain: str, hashed: str) -> bool:
    """Verify a plain passphrase against a bcrypt hash."""
    return bcrypt.checkpw(plain.encode(), hashed.encode())
