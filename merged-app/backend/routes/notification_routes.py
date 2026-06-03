from flask import Blueprint
from middleware.auth_middleware import jwt_required_custom
from database.mongo import mongo
from flask_jwt_extended import get_jwt_identity
from utils.response_helper import success_response
from bson import ObjectId
from datetime import datetime, timezone

notification_bp = Blueprint('notifications', __name__)

@notification_bp.get('/')
@jwt_required_custom
def get_notifications():
    user_id = get_jwt_identity()
    notifs = list(mongo.db.notifications.find({'user_id': ObjectId(user_id)}).sort('created_at', -1).limit(50))
    for n in notifs:
        n['_id'] = str(n['_id'])
        n['user_id'] = str(n['user_id'])
    return success_response('Notifications fetched', notifs)

@notification_bp.post('/<notif_id>/read')
@jwt_required_custom
def mark_read(notif_id):
    user_id = get_jwt_identity()
    mongo.db.notifications.update_one(
        {'_id': ObjectId(notif_id), 'user_id': ObjectId(user_id)},
        {'$set': {'read': True}}
    )
    return success_response('Marked as read')

@notification_bp.post('/read-all')
@jwt_required_custom
def mark_all_read():
    user_id = get_jwt_identity()
    mongo.db.notifications.update_many(
        {'user_id': ObjectId(user_id), 'read': False},
        {'$set': {'read': True}}
    )
    return success_response('All notifications marked as read')
