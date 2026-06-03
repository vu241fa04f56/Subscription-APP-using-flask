from datetime import datetime, timezone
from bson import ObjectId

class PaymentModel:
    COLLECTION = 'payments'
    STATUSES = ['created', 'authorized', 'captured', 'failed', 'refunded']

    @staticmethod
    def create(user_id, amount, currency, plan_id, razorpay_order_id):
        now = datetime.now(timezone.utc)
        return {
            'user_id': ObjectId(user_id) if isinstance(user_id, str) else user_id,
            'plan_id': ObjectId(plan_id) if isinstance(plan_id, str) else plan_id,
            'amount': amount,
            'currency': currency,
            'status': 'created',
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': None,
            'razorpay_signature': None,
            'invoice_url': None,
            'metadata': {},
            'created_at': now,
            'updated_at': now,
        }
