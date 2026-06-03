from datetime import datetime, timezone
from bson import ObjectId

class AdminModel:
    COLLECTION = 'admins'
    ROLES = ['super_admin', 'moderator', 'support']

    @staticmethod
    def default(role='moderator'):
        now = datetime.now(timezone.utc)
        return {
            'role': role,
            'is_active': True,
            'permissions': AdminModel.role_permissions(role),
            'created_at': now,
            'updated_at': now,
        }

    @staticmethod
    def role_permissions(role):
        perms = {
            'super_admin': ['all'],
            'moderator': ['users.read', 'users.ban', 'content.moderate', 'analytics.read'],
            'support': ['users.read', 'tickets.manage'],
        }
        return perms.get(role, [])
