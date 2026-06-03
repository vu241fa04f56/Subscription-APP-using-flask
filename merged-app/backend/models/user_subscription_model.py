from datetime import datetime, timezone
from bson import ObjectId

class UserSubscriptionModel:
    COLLECTION = 'user_subscriptions'
    STATUSES = ['active', 'expired', 'cancelled', 'trial', 'past_due']

    @staticmethod
    def create(user_id, plan_id, payment_id=None, status='active', trial=False):
        now = datetime.now(timezone.utc)
        return {
            'user_id': ObjectId(user_id) if isinstance(user_id, str) else user_id,
            'plan_id': ObjectId(plan_id) if isinstance(plan_id, str) else plan_id,
            'payment_id': payment_id,
            'status': 'trial' if trial else status,
            'auto_renew': True,
            'starts_at': now,
            'expires_at': None,     # set by service
            'cancelled_at': None,
            'created_at': now,
            'updated_at': now,
        }
