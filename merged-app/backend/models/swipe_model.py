from datetime import datetime, timezone
from bson import ObjectId

class SwipeModel:
    COLLECTION = 'user_swipes'

    @staticmethod
    def create(user_id, target_id, action):
        return {
            'user_id': ObjectId(user_id) if isinstance(user_id, str) else user_id,
            'target_id': ObjectId(target_id) if isinstance(target_id, str) else target_id,
            'action': action, # 'like' or 'pass'
            'created_at': datetime.now(timezone.utc)
        }
