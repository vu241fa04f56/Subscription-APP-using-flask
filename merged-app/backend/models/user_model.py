from datetime import datetime, timezone
from bson import ObjectId

class UserModel:
    COLLECTION = 'users'

    SCHEMA = {
        '_id': ObjectId,
        'email': str,               # optional if phone/google
        'phone': str,               # optional
        'google_id': str,           # optional
        'password': str,            # hashed, optional for OAuth users
        'name': str,
        'avatar': str,              # URL
        'bio': str,
        'age': int,                 # Age field
        'photos': list,             # list of strings (up to 5 photo URLs)
        'interests': list,          # list of strings
        'skills': list,
        'location': dict,           # GeoJSON { type: Point, coordinates: [lng, lat] }
        'city': str,
        'country': str,
        'auth_provider': str,       # 'email', 'phone', 'google'
        'is_verified': bool,
        'is_active': bool,
        'is_premium': bool,
        'subscription_id': ObjectId,
        'profile_complete': bool,
        'last_seen': datetime,
        'created_at': datetime,
        'updated_at': datetime,
    }

    @staticmethod
    def default(auth_provider='email'):
        now = datetime.now(timezone.utc)
        return {
            'auth_provider': auth_provider,
            'is_verified': False,
            'is_active': True,
            'is_premium': False,
            'profile_complete': False,
            'interests': [],
            'skills': [],
            'photos': [],
            'age': None,
            'last_seen': now,
            'created_at': now,
            'updated_at': now,
        }

    @staticmethod
    def public_fields():
        return {
            '_id': 1, 'name': 1, 'avatar': 1, 'bio': 1,
            'interests': 1, 'skills': 1, 'city': 1, 'country': 1,
            'is_premium': 1, 'last_seen': 1, 'age': 1, 'photos': 1
        }
