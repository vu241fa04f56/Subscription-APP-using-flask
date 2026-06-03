import os
from flask import request, current_app
from flask_jwt_extended import get_jwt_identity
from bson import ObjectId
from database.mongo import mongo
from utils.response_helper import success_response, error_response
from datetime import datetime, timezone
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class UserController:

    @staticmethod
    def get_profile():
        user_id = get_jwt_identity()
        user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return error_response('User not found', status_code=404)
        user['_id'] = str(user['_id'])
        user.pop('password', None)
        if 'subscription_id' in user:
            user['subscription_id'] = str(user['subscription_id'])
        # Ensure avatar URL is absolute
        backend_url = current_app.config.get('BACKEND_URL', 'http://127.0.0.1:5000')
        if user.get('avatar') and user['avatar'].startswith('/uploads/'):
            user['avatar'] = backend_url + user['avatar']
        return success_response('Profile fetched', user)

    @staticmethod
    def update_profile():
        user_id = get_jwt_identity()
        data = request.get_json()
        allowed = ['name', 'bio', 'interests', 'skills', 'city', 'country', 'age', 'show_last_seen']
        updates = {k: v for k, v in data.items() if k in allowed}
        
        if 'age' in updates and updates['age'] is not None:
            try:
                updates['age'] = int(updates['age'])
            except (ValueError, TypeError):
                updates['age'] = None
                
        updates['updated_at'] = datetime.now(timezone.utc)
        updates['profile_complete'] = bool(updates.get('name') or data.get('name'))
        mongo.db.users.update_one({'_id': ObjectId(user_id)}, {'$set': updates})
        return success_response('Profile updated')

    @staticmethod
    def upload_avatar():
        user_id = get_jwt_identity()
        if 'avatar' not in request.files:
            return error_response('No file provided')
        file = request.files['avatar']
        if file.filename == '' or not allowed_file(file.filename):
            return error_response('Invalid file type')
        filename = secure_filename(f"{user_id}_{file.filename}")
        upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'profile_images')
        os.makedirs(upload_dir, exist_ok=True)
        path = os.path.join(upload_dir, filename)
        file.save(path)
        # Return full URL so the frontend can load it from the backend server directly
        backend_url = current_app.config.get('BACKEND_URL', 'http://127.0.0.1:5000')
        avatar_url = f"{backend_url}/uploads/profile_images/{filename}"
        mongo.db.users.update_one({'_id': ObjectId(user_id)}, {'$set': {'avatar': avatar_url}})
        return success_response('Avatar uploaded', {'avatar_url': avatar_url})

    @staticmethod
    def delete_account():
        user_id = get_jwt_identity()
        mongo.db.users.update_one({'_id': ObjectId(user_id)}, {'$set': {'is_active': False}})
        mongo.db.refresh_tokens.update_many({'user_id': ObjectId(user_id)}, {'$set': {'is_revoked': True}})
        return success_response('Account deactivated')

    @staticmethod
    def get_user_by_id(user_id):
        from models.user_model import UserModel
        user = mongo.db.users.find_one({'_id': ObjectId(user_id)}, UserModel.public_fields())
        if not user:
            return error_response('User not found', status_code=404)
        user['_id'] = str(user['_id'])
        return success_response('User profile', user)

    @staticmethod
    def upload_photos():
        user_id = get_jwt_identity()
        user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return error_response('User not found', status_code=404)
        
        current_photos = user.get('photos', [])
        if len(current_photos) >= 5:
            return error_response('Maximum 5 photos allowed')
            
        if 'photo' not in request.files:
            return error_response('No file provided')
            
        file = request.files['photo']
        if file.filename == '' or not allowed_file(file.filename):
            return error_response('Invalid file type')
            
        filename = secure_filename(f"{user_id}_photo_{len(current_photos)}_{file.filename}")
        upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'profile_images')
        os.makedirs(upload_dir, exist_ok=True)
        path = os.path.join(upload_dir, filename)
        file.save(path)
        
        photo_url = f"{current_app.config.get('BACKEND_URL', 'http://127.0.0.1:5000')}/uploads/profile_images/{filename}"
        mongo.db.users.update_one(
            {'_id': ObjectId(user_id)}, 
            {
                '$push': {'photos': photo_url},
                **({'$set': {'avatar': photo_url}} if not user.get('avatar') else {})
            }
        )
        
        updated_user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
        return success_response('Photo uploaded successfully', {'photos': updated_user.get('photos', [])})

    @staticmethod
    def delete_photo():
        user_id = get_jwt_identity()
        data = request.get_json()
        photo_url = data.get('url')
        if not photo_url:
            return error_response('Photo URL required')
            
        mongo.db.users.update_one({'_id': ObjectId(user_id)}, {'$pull': {'photos': photo_url}})
        
        try:
            if photo_url.startswith('/uploads/'):
                file_path = photo_url.lstrip('/')
                if os.path.exists(file_path):
                    os.remove(file_path)
        except Exception:
            pass
            
        updated_user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
        remaining = updated_user.get('photos', [])
        
        if updated_user.get('avatar') == photo_url:
            new_avatar = remaining[0] if remaining else None
            mongo.db.users.update_one({'_id': ObjectId(user_id)}, {'$set': {'avatar': new_avatar}})
            
        return success_response('Photo deleted successfully', {'photos': remaining})

    @staticmethod
    def swipe():
        from models.swipe_model import SwipeModel
        from models.chat_model import ChatModel
        
        user_id = get_jwt_identity()
        data = request.get_json()
        target_id = data.get('target_id')
        action = data.get('action')
        
        if not target_id or action not in ['like', 'pass']:
            return error_response('target_id and action (like/pass) are required')
            
        swipe_doc = SwipeModel.create(user_id, target_id, action)
        mongo.db.user_swipes.update_one(
            {'user_id': ObjectId(user_id), 'target_id': ObjectId(target_id)},
            {'$set': swipe_doc},
            upsert=True
        )
        
        is_match = False
        chat_id = None
        
        if action == 'like':
            mutual = mongo.db.user_swipes.find_one({
                'user_id': ObjectId(target_id),
                'target_id': ObjectId(user_id),
                'action': 'like'
            })
            if mutual:
                is_match = True
                existing = mongo.db.chats.find_one({'participants': {'$all': [ObjectId(user_id), ObjectId(target_id)]}})
                if existing:
                    chat_id = str(existing['_id'])
                else:
                    chat_doc = ChatModel.create([user_id, target_id])
                    result = mongo.db.chats.insert_one(chat_doc)
                    chat_id = str(result.inserted_id)
                    
                    notif_1 = {
                        'user_id': ObjectId(user_id),
                        'type': 'match',
                        'content': "It's a Match! Start chatting now.",
                        'read': False,
                        'created_at': datetime.now(timezone.utc)
                    }
                    notif_2 = {
                        'user_id': ObjectId(target_id),
                        'type': 'match',
                        'content': "It's a Match! Start chatting now.",
                        'read': False,
                        'created_at': datetime.now(timezone.utc)
                    }
                    mongo.db.notifications.insert_many([notif_1, notif_2])
                    
        return success_response('Swipe registered', {
            'is_match': is_match,
            'chat_id': chat_id
        })

    @staticmethod
    def get_user_stats():
        from datetime import datetime, timezone, timedelta
        online_threshold = datetime.now(timezone.utc) - timedelta(seconds=15)
        online_users = mongo.db.users.count_documents({
            'is_active': True,
            'last_seen': {'$gte': online_threshold}
        })
        return success_response('Stats fetched', {'online_users': online_users})
