from datetime import datetime, timezone
from bson import ObjectId

from database.mongo import mongo
from models.user_model import UserModel
from models.refresh_token_model import RefreshTokenModel
from models.activity_log_model import ActivityLogModel
from utils.password_helper import hash_password, verify_password
from utils.jwt_helper import generate_tokens


class AuthService:

    @staticmethod
    def register_email(email, password, name):
        existing = mongo.db.users.find_one({'email': email.lower()})
        if existing:
            return None, 'Email already registered'

        user_data = UserModel.default('email')
        user_data.update({
            'email': email.lower(),
            'password': hash_password(password),
            'name': name,
        })
        result = mongo.db.users.insert_one(user_data)
        user_id = str(result.inserted_id)
        access_token, refresh_token = generate_tokens(user_id, {'role': 'user'})
        AuthService._save_refresh_token(user_id, refresh_token)
        return {'access_token': access_token, 'refresh_token': refresh_token, 'user_id': user_id}, None

    @staticmethod
    def login_email(email, password, ip=None):
        user = mongo.db.users.find_one({'email': email.lower()})
        if not user:
            return None, 'Invalid email or password'
        if not user.get('password'):
            return None, 'This account uses social login'
        if not verify_password(password, user['password']):
            return None, 'Invalid email or password'
        if not user.get('is_active'):
            return None, 'Account is deactivated'

        user_id = str(user['_id'])
        mongo.db.users.update_one({'_id': user['_id']}, {'$set': {'last_seen': datetime.now(timezone.utc)}})
        access_token, refresh_token = generate_tokens(user_id, {'role': 'user'})
        AuthService._save_refresh_token(user_id, refresh_token)

        log = ActivityLogModel.create(user_id, 'login', ip=ip)
        mongo.db.activity_logs.insert_one(log)
        return {'access_token': access_token, 'refresh_token': refresh_token, 'user_id': user_id}, None

    @staticmethod
    def refresh_access_token(refresh_token_str):
        token_doc = mongo.db.refresh_tokens.find_one({'token': refresh_token_str, 'is_revoked': False})
        if not token_doc:
            return None, 'Invalid refresh token'
        if token_doc['expires_at'] < datetime.now(timezone.utc):
            return None, 'Refresh token expired'
        user_id = str(token_doc['user_id'])
        access_token, new_refresh = generate_tokens(user_id, {'role': 'user'})
        mongo.db.refresh_tokens.update_one({'_id': token_doc['_id']}, {'$set': {'is_revoked': True}})
        AuthService._save_refresh_token(user_id, new_refresh)
        return {'access_token': access_token, 'refresh_token': new_refresh}, None

    @staticmethod
    def logout(refresh_token_str):
        mongo.db.refresh_tokens.update_one(
            {'token': refresh_token_str},
            {'$set': {'is_revoked': True}}
        )

    @staticmethod
    def _save_refresh_token(user_id, token_str):
        token_doc = RefreshTokenModel.create(user_id)
        token_doc['token'] = token_str
        mongo.db.refresh_tokens.insert_one(token_doc)
