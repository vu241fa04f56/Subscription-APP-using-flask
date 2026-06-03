import razorpay
from flask import current_app
import hmac, hashlib

def get_razorpay_client():
    return razorpay.Client(
        auth=(current_app.config['RAZORPAY_KEY_ID'], current_app.config['RAZORPAY_KEY_SECRET'])
    )

class RazorpayService:

    @staticmethod
    def create_order(amount_paise: int, currency: str = 'INR', receipt: str = None, notes: dict = None):
        key_id = current_app.config.get('RAZORPAY_KEY_ID', '')
        key_secret = current_app.config.get('RAZORPAY_KEY_SECRET', '')
        if not key_id or not key_secret or 'placeholder' in key_id.lower() or 'your-' in key_id.lower():
            import uuid
            return {
                'id': f"order_mock_{uuid.uuid4().hex[:12]}",
                'amount': amount_paise,
                'currency': currency,
                'receipt': receipt or 'receipt',
                'status': 'created'
            }
        client = get_razorpay_client()
        data = {
            'amount': amount_paise,
            'currency': currency,
            'receipt': receipt or 'receipt',
            'notes': notes or {},
            'payment_capture': 1,
        }
        order = client.order.create(data=data)
        return order

    @staticmethod
    def verify_signature(order_id: str, payment_id: str, signature: str) -> bool:
        key_id = current_app.config.get('RAZORPAY_KEY_ID', '')
        key_secret = current_app.config.get('RAZORPAY_KEY_SECRET', '')
        if not key_id or not key_secret or 'placeholder' in key_id.lower() or 'your-' in key_id.lower():
            return True
        secret = current_app.config['RAZORPAY_KEY_SECRET']
        body = f"{order_id}|{payment_id}"
        expected = hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)

    @staticmethod
    def capture_payment(payment_id: str, amount_paise: int):
        key_id = current_app.config.get('RAZORPAY_KEY_ID', '')
        key_secret = current_app.config.get('RAZORPAY_KEY_SECRET', '')
        if not key_id or not key_secret or 'placeholder' in key_id.lower() or 'your-' in key_id.lower():
            return {'status': 'captured'}
        client = get_razorpay_client()
        return client.payment.capture(payment_id, amount_paise)

    @staticmethod
    def refund_payment(payment_id: str, amount_paise: int = None):
        key_id = current_app.config.get('RAZORPAY_KEY_ID', '')
        key_secret = current_app.config.get('RAZORPAY_KEY_SECRET', '')
        if not key_id or not key_secret or 'placeholder' in key_id.lower() or 'your-' in key_id.lower():
            return {'status': 'refunded'}
        client = get_razorpay_client()
        data = {'amount': amount_paise} if amount_paise else {}
        return client.payment.refund(payment_id, data)
