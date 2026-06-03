from datetime import datetime, timezone, timedelta
from bson import ObjectId

from database.mongo import mongo
from models.user_subscription_model import UserSubscriptionModel

INTERVAL_DAYS = {'monthly': 30, 'quarterly': 90, 'yearly': 365}

class SubscriptionService:

    @staticmethod
    def activate(user_id: str, plan_id: str, payment_id: str = None):
        plan = mongo.db.subscription_plans.find_one({'_id': ObjectId(plan_id)})
        if not plan:
            return None, 'Plan not found'

        now = datetime.now(timezone.utc)
        days = INTERVAL_DAYS.get(plan.get('interval', 'monthly'), 30)
        sub_doc = UserSubscriptionModel.create(user_id, plan_id, payment_id)
        sub_doc['expires_at'] = now + timedelta(days=days)

        # Cancel any existing active subscription
        mongo.db.user_subscriptions.update_many(
            {'user_id': ObjectId(user_id), 'status': {'$in': ['active', 'trial']}},
            {'$set': {'status': 'cancelled', 'cancelled_at': now}}
        )

        result = mongo.db.user_subscriptions.insert_one(sub_doc)
        mongo.db.users.update_one({'_id': ObjectId(user_id)}, {
            '$set': {
                'is_premium': True,
                'subscription_id': result.inserted_id,
                'updated_at': now,
            }
        })
        return {'subscription_id': str(result.inserted_id), 'expires_at': sub_doc['expires_at'].isoformat()}, None

    @staticmethod
    def cancel(user_id: str):
        now = datetime.now(timezone.utc)
        mongo.db.user_subscriptions.update_many(
            {'user_id': ObjectId(user_id), 'status': 'active'},
            {'$set': {'status': 'cancelled', 'auto_renew': False, 'cancelled_at': now}}
        )
        mongo.db.users.update_one({'_id': ObjectId(user_id)}, {
            '$set': {'is_premium': False, 'updated_at': now}
        })
        return True

    @staticmethod
    def get_active_subscription(user_id: str):
        return mongo.db.user_subscriptions.find_one({
            'user_id': ObjectId(user_id),
            'status': {'$in': ['active', 'trial']},
            'expires_at': {'$gt': datetime.now(timezone.utc)}
        })

    @staticmethod
    def expire_subscriptions():
        """Called by scheduler to expire overdue subscriptions."""
        now = datetime.now(timezone.utc)
        expired = mongo.db.user_subscriptions.find({
            'status': 'active',
            'expires_at': {'$lte': now}
        })
        for sub in expired:
            mongo.db.user_subscriptions.update_one(
                {'_id': sub['_id']},
                {'$set': {'status': 'expired'}}
            )
            mongo.db.users.update_one(
                {'_id': sub['user_id']},
                {'$set': {'is_premium': False}}
            )
