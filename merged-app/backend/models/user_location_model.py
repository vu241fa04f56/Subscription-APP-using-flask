from datetime import datetime, timezone
from bson import ObjectId

class UserLocationModel:
    COLLECTION = 'user_locations'

    @staticmethod
    def create(user_id, latitude, longitude, city=None, country=None):
        now = datetime.now(timezone.utc)
        return {
            'user_id': ObjectId(user_id) if isinstance(user_id, str) else user_id,
            'location': {
                'type': 'Point',
                'coordinates': [longitude, latitude]
            },
            'city': city,
            'country': country,
            'accuracy': None,
            'updated_at': now,
        }
