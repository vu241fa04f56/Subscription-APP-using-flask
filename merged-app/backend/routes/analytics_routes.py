from flask import Blueprint
from middleware.auth_middleware import jwt_required_custom
from flask_jwt_extended import get_jwt_identity
from database.mongo import mongo
from utils.response_helper import success_response
from bson import ObjectId

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.get('/me')
@jwt_required_custom
def my_analytics():
    user_id = get_jwt_identity()
    logs = list(mongo.db.activity_logs.find({'user_id': ObjectId(user_id)}).sort('created_at', -1).limit(100))
    actions = {}
    for log in logs:
        a = log.get('action', 'unknown')
        actions[a] = actions.get(a, 0) + 1
    return success_response('Analytics', {'action_counts': actions, 'total': len(logs)})
