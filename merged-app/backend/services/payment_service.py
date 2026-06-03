from datetime import datetime, timezone
from bson import ObjectId

from database.mongo import mongo
from models.payment_model import PaymentModel
from services.razorpay_service import RazorpayService
from services.subscription_service import SubscriptionService
from services.email_service import EmailService
from utils.invoice_generator import generate_invoice
import os

class PaymentService:

    @staticmethod
    def initiate_payment(user_id: str, plan_id: str):
        plan = mongo.db.subscription_plans.find_one({'_id': ObjectId(plan_id)})
        if not plan:
            return None, 'Plan not found'
        if plan.get('is_free'):
            return None, 'Free plan does not require payment'

        amount_paise = plan['price'] * 100
        receipt = f"sub_{user_id[:8]}_{plan['slug']}"
        order = RazorpayService.create_order(amount_paise, plan['currency'], receipt)

        payment = PaymentModel.create(user_id, amount_paise, plan['currency'], plan_id, order['id'])
        result = mongo.db.payments.insert_one(payment)

        return {
            'payment_id': str(result.inserted_id),
            'razorpay_order_id': order['id'],
            'razorpay_key': __import__('flask').current_app.config['RAZORPAY_KEY_ID'],
            'amount': amount_paise,
            'currency': plan['currency'],
            'plan_name': plan['name'],
        }, None

    @staticmethod
    def verify_and_complete(user_id: str, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str):
        if not RazorpayService.verify_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
            return None, 'Payment verification failed'

        payment = mongo.db.payments.find_one({'razorpay_order_id': razorpay_order_id})
        if not payment:
            return None, 'Payment record not found'

        mongo.db.payments.update_one({'_id': payment['_id']}, {
            '$set': {
                'status': 'captured',
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature,
                'updated_at': datetime.now(timezone.utc),
            }
        })

        sub, err = SubscriptionService.activate(user_id, str(payment['plan_id']), str(payment['_id']))
        if err:
            return None, err

        # Generate invoice
        user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
        plan = mongo.db.subscription_plans.find_one({'_id': payment['plan_id']})
        invoice_path = f"uploads/invoices/invoice_{payment['_id']}.pdf"
        generate_invoice(payment, user or {}, plan or {}, invoice_path)
        mongo.db.payments.update_one({'_id': payment['_id']}, {'$set': {'invoice_url': invoice_path}})

        if user and user.get('email'):
            EmailService.send_payment_success_email(
                user['email'], user.get('name', ''), plan.get('name', ''),
                payment['amount'] / 100, invoice_path
            )

        return {'subscription': sub}, None
