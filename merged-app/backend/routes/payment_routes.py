from flask import Blueprint
from controllers.payment_controller import PaymentController
from middleware.auth_middleware import jwt_required_custom

payment_bp = Blueprint('payments', __name__)

@payment_bp.post('/create-order')
@jwt_required_custom
def create_order():
    return PaymentController.create_order()

@payment_bp.post('/verify')
@jwt_required_custom
def verify():
    return PaymentController.verify_payment()

@payment_bp.get('/history')
@jwt_required_custom
def history():
    return PaymentController.payment_history()

@payment_bp.get('/invoice/<payment_id>')
@jwt_required_custom
def invoice(payment_id):
    return PaymentController.download_invoice(payment_id)

@payment_bp.post('/webhook')
def webhook():
    return PaymentController.razorpay_webhook()
