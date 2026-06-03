from datetime import datetime, timezone
from bson import ObjectId

class NotificationModel:
    COLLECTION = 'notifications'
    TYPES = ['match', 'message', 'subscription', 'payment', 'system', 'nearby']

    @staticmethod
    def create(user_id, title, body, notif_type='system', data=None):
        now = datetime.now(timezone.utc)
        return {
            'user_id': ObjectId(user_id) if isinstance(user_id, str) else user_id,
            'title': title,
            'body': body,
            'type': notif_type,
            'data': data or {},
            'read': False,
            'created_at': now,
        }
