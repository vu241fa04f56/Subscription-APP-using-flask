from datetime import datetime, timezone, timedelta
from bson import ObjectId
import secrets

class RefreshTokenModel:
    COLLECTION = 'refresh_tokens'

    @staticmethod
    def create(user_id, days=30):
        now = datetime.now(timezone.utc)
        return {
            'user_id': ObjectId(user_id) if isinstance(user_id, str) else user_id,
            'token': secrets.token_urlsafe(64),
            'is_revoked': False,
            'expires_at': now + timedelta(days=days),
            'created_at': now,
        }
