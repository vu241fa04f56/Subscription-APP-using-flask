from flask import Blueprint
from controllers.subscription_controller import SubscriptionController
from middleware.auth_middleware import jwt_required_custom

subscription_bp = Blueprint('subscriptions', __name__)

@subscription_bp.get('/plans')
def get_plans():
    return SubscriptionController.get_plans()

@subscription_bp.get('/my')
@jwt_required_custom
def my_subscription():
    return SubscriptionController.my_subscription()

@subscription_bp.post('/subscribe/<plan_id>')
@jwt_required_custom
def subscribe(plan_id):
    return SubscriptionController.subscribe(plan_id)

@subscription_bp.post('/cancel')
@jwt_required_custom
def cancel():
    return SubscriptionController.cancel()

@subscription_bp.get('/history')
@jwt_required_custom
def history():
    return SubscriptionController.history()
