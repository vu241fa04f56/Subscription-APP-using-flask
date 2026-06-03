from flask import request, send_file, current_app
from flask_jwt_extended import get_jwt_identity
from bson import ObjectId
from database.mongo import mongo
from services.payment_service import PaymentService
from services.razorpay_service import RazorpayService
from utils.response_helper import success_response, error_response
import os, json, hmac, hashlib

class PaymentController:

    @staticmethod
    def create_order():
        user_id = get_jwt_identity()
        data = request.get_json()
        plan_id = data.get('plan_id')
        if not plan_id:
            return error_response('Plan ID required')
        order, err = PaymentService.initiate_payment(user_id, plan_id)
        if err:
            return error_response(err)
        return success_response('Order created', order)

    @staticmethod
    def verify_payment():
        user_id = get_jwt_identity()
        data = request.get_json()
        result, err = PaymentService.verify_and_complete(
            user_id,
            data.get('razorpay_order_id'),
            data.get('razorpay_payment_id'),
            data.get('razorpay_signature'),
        )
        if err:
            return error_response(err, status_code=400)
        return success_response('Payment verified. Subscription activated.', result)

    @staticmethod
    def payment_history():
        user_id = get_jwt_identity()
        payments = list(mongo.db.payments.find({'user_id': ObjectId(user_id)}).sort('created_at', -1))
        for p in payments:
            p['_id'] = str(p['_id'])
            p['user_id'] = str(p['user_id'])
            p['plan_id'] = str(p['plan_id'])
        return success_response('Payment history', payments)

    @staticmethod
    def download_invoice(payment_id):
        user_id = get_jwt_identity()
        payment = mongo.db.payments.find_one({'_id': ObjectId(payment_id), 'user_id': ObjectId(user_id)})
        if not payment:
            return error_response('Payment not found', status_code=404)
        invoice_path = payment.get('invoice_url')
        if not invoice_path or not os.path.exists(invoice_path):
            return error_response('Invoice not available', status_code=404)
        return send_file(invoice_path, as_attachment=True, download_name=f'invoice_{payment_id}.pdf')

    @staticmethod
    def razorpay_webhook():
        webhook_secret = current_app.config.get('RAZORPAY_KEY_SECRET', '')
        payload = request.get_data()
        signature = request.headers.get('X-Razorpay-Signature', '')
        expected = hmac.new(webhook_secret.encode(), payload, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            return error_response('Invalid webhook signature', status_code=400)
        event = request.get_json()
        event_type = event.get('event')
        if event_type == 'payment.failed':
            order_id = event['payload']['payment']['entity'].get('order_id')
            if order_id:
                mongo.db.payments.update_one({'razorpay_order_id': order_id}, {'$set': {'status': 'failed'}})
        return success_response('Webhook processed')
