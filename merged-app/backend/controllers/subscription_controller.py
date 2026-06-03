from flask import request
from flask_jwt_extended import get_jwt_identity
from bson import ObjectId
from database.mongo import mongo
from services.subscription_service import SubscriptionService
from services.payment_service import PaymentService
from utils.response_helper import success_response, error_response

class SubscriptionController:

    @staticmethod
    def get_plans():
        plans = list(mongo.db.subscription_plans.find({'is_active': True}).sort('sort_order', 1))
        for p in plans:
            p['_id'] = str(p['_id'])
        return success_response('Plans fetched', plans)

    @staticmethod
    def my_subscription():
        user_id = get_jwt_identity()
        sub = SubscriptionService.get_active_subscription(user_id)
        if not sub:
            return success_response('No active subscription', None)
        sub['_id'] = str(sub['_id'])
        sub['user_id'] = str(sub['user_id'])
        sub['plan_id'] = str(sub['plan_id'])
        plan = mongo.db.subscription_plans.find_one({'_id': ObjectId(str(sub['plan_id']))})
        if plan:
            plan['_id'] = str(plan['_id'])
            sub['plan'] = plan
        return success_response('Subscription fetched', sub)

    @staticmethod
    def subscribe(plan_id):
        user_id = get_jwt_identity()
        plan = mongo.db.subscription_plans.find_one({'_id': ObjectId(plan_id)})
        if not plan:
            return error_response('Plan not found', status_code=404)
        if plan.get('is_free'):
            sub, err = SubscriptionService.activate(user_id, plan_id)
            if err:
                return error_response(err)
            return success_response('Subscribed to free plan', sub)
        order, err = PaymentService.initiate_payment(user_id, plan_id)
        if err:
            return error_response(err)
        return success_response('Payment order created', order)

    @staticmethod
    def cancel():
        user_id = get_jwt_identity()
        SubscriptionService.cancel(user_id)
        return success_response('Subscription cancelled')

    @staticmethod
    def history():
        user_id = get_jwt_identity()
        subs = list(mongo.db.user_subscriptions.find({'user_id': ObjectId(user_id)}).sort('created_at', -1))
        for s in subs:
            s['_id'] = str(s['_id'])
            s['user_id'] = str(s['user_id'])
            s['plan_id'] = str(s['plan_id'])
        return success_response('Subscription history', subs)
