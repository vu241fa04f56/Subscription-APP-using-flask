from flask_jwt_extended import create_access_token, create_refresh_token, decode_token as _decode
from datetime import timedelta

def generate_tokens(identity: str, additional_claims: dict = None):
    access_token = create_access_token(
        identity=identity,
        additional_claims=additional_claims or {}
    )
    refresh_token = create_refresh_token(identity=identity)
    return access_token, refresh_token

def decode_token(token: str):
    try:
        return _decode(token)
    except Exception as e:
        return None
