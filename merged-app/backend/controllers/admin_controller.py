from flask import request
from flask_jwt_extended import get_jwt_identity
from bson import ObjectId
from database.mongo import mongo
from utils.password_helper import verify_password
from utils.jwt_helper import generate_tokens
from utils.response_helper import success_response, error_response, paginated_response
from models.subscription_plan_model import SubscriptionPlanModel
from datetime import datetime, timezone


def _sanitize(obj):
    """Recursively convert ObjectId → str and datetime → ISO string so Flask
    can JSON-serialize any MongoDB document regardless of nested fields."""
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(i) for i in obj]
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat() + 'Z'
    return obj


class AdminController:

    @staticmethod
    def login():
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        admin = mongo.db.admins.find_one({'email': email, 'is_active': True})
        if not admin or not verify_password(password, admin['password']):
            return error_response('Invalid credentials', status_code=401)
        access_token, _ = generate_tokens(str(admin['_id']), {'role': 'admin', 'type': 'admin', 'admin_role': admin['role']})
        return success_response('Admin login successful', {'access_token': access_token, 'admin_role': admin['role']})

    @staticmethod
    def dashboard():
        from datetime import datetime, timezone, timedelta
        online_threshold = datetime.now(timezone.utc) - timedelta(seconds=15)
        total_users = mongo.db.users.count_documents({'is_active': True})
        total_premium = mongo.db.users.count_documents({'is_premium': True})
        online_users = mongo.db.users.count_documents({
            'is_active': True,
            'last_seen': {'$gte': online_threshold}
        })
        total_revenue_docs = list(mongo.db.payments.aggregate([
            {'$match': {'status': 'captured'}},
            {'$group': {'_id': None, 'total': {'$sum': '$amount'}}}
        ]))
        total_revenue = total_revenue_docs[0]['total'] / 100 if total_revenue_docs else 0
        active_subs = mongo.db.user_subscriptions.count_documents({'status': 'active'})
        return success_response('Dashboard data', {
            'total_users': total_users,
            'online_users': online_users,
            'premium_users': total_premium,
            'total_revenue_inr': total_revenue,
            'active_subscriptions': active_subs,
        })

    @staticmethod
    def list_users():
        page     = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search   = request.args.get('search', '')
        query = {}
        if search:
            query['$or'] = [
                {'name':  {'$regex': search, '$options': 'i'}},
                {'email': {'$regex': search, '$options': 'i'}},
            ]
        total = mongo.db.users.count_documents(query)
        users = list(mongo.db.users.find(query, {'password': 0})
                     .skip((page - 1) * per_page).limit(per_page))
        return paginated_response('Users fetched', _sanitize(users), total, page, per_page)

    @staticmethod
    def user_detail(user_id):
        user = mongo.db.users.find_one({'_id': ObjectId(user_id)}, {'password': 0})
        if not user:
            return error_response('User not found', status_code=404)
        return success_response('User detail', _sanitize(user))

    @staticmethod
    def ban_user(user_id):
        mongo.db.users.update_one({'_id': ObjectId(user_id)}, {'$set': {'is_active': False}})
        return success_response('User banned')

    @staticmethod
    def unban_user(user_id):
        mongo.db.users.update_one({'_id': ObjectId(user_id)}, {'$set': {'is_active': True}})
        return success_response('User unbanned')

    @staticmethod
    def list_subscriptions():
        page     = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        total = mongo.db.user_subscriptions.count_documents({})
        subs  = list(mongo.db.user_subscriptions.find({})
                     .skip((page - 1) * per_page).limit(per_page))
        return paginated_response('Subscriptions fetched', _sanitize(subs), total, page, per_page)

    @staticmethod
    def list_payments():
        page     = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        total    = mongo.db.payments.count_documents({})
        payments = list(mongo.db.payments.find({}).sort('created_at', -1)
                        .skip((page - 1) * per_page).limit(per_page))
        return paginated_response('Payments fetched', _sanitize(payments), total, page, per_page)

    @staticmethod
    def list_plans():
        plans = list(mongo.db.subscription_plans.find({'is_active': True}))
        return success_response('Plans fetched', _sanitize(plans))

    @staticmethod
    def create_plan():
        data = request.get_json()
        plan = SubscriptionPlanModel.default()
        plan.update({k: v for k, v in data.items() if k in ['name', 'slug', 'price', 'currency', 'interval', 'features', 'limits', 'is_free', 'trial_days', 'sort_order']})
        result = mongo.db.subscription_plans.insert_one(plan)
        return success_response('Plan created', {'plan_id': str(result.inserted_id)}, 201)

    @staticmethod
    def update_plan(plan_id):
        data = request.get_json()
        data['updated_at'] = datetime.now(timezone.utc)
        mongo.db.subscription_plans.update_one({'_id': ObjectId(plan_id)}, {'$set': data})
        return success_response('Plan updated')

    @staticmethod
    def delete_plan(plan_id):
        mongo.db.subscription_plans.update_one({'_id': ObjectId(plan_id)}, {'$set': {'is_active': False}})
        return success_response('Plan deactivated')
