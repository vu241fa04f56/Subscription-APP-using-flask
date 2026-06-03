from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from bson import ObjectId
from database.mongo import mongo

def jwt_required_custom(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            if user_id:
                from datetime import datetime, timezone
                mongo.db.users.update_one(
                    {'_id': ObjectId(user_id)},
                    {'$set': {'last_seen': datetime.now(timezone.utc)}}
                )
        except Exception as e:
            return jsonify({'success': False, 'message': 'Unauthorized', 'error': str(e)}), 401
        return f(*args, **kwargs)
    return decorated

def get_current_user():
    user_id = get_jwt_identity()
    return mongo.db.users.find_one({'_id': ObjectId(user_id)})

def subscription_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
            if not user or not user.get('is_premium'):
                return jsonify({'success': False, 'message': 'Premium subscription required'}), 403
        except Exception as e:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated
