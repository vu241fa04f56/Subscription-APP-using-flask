from datetime import datetime, timezone
from bson import ObjectId

class ActivityLogModel:
    COLLECTION = 'activity_logs'
    ACTIONS = [
        'login', 'logout', 'register', 'password_change',
        'subscription_purchase', 'subscription_cancel',
        'profile_update', 'match_viewed', 'chat_sent',
    ]

    @staticmethod
    def create(user_id, action, metadata=None, ip=None):
        now = datetime.now(timezone.utc)
        return {
            'user_id': ObjectId(user_id) if isinstance(user_id, str) else user_id,
            'action': action,
            'metadata': metadata or {},
            'ip_address': ip,
            'created_at': now,
        }
