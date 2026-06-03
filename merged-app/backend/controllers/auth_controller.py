from flask import request
from flask_jwt_extended import get_jwt_identity
from bson import ObjectId

from database.mongo import mongo
from services.auth_service import AuthService
from services.otp_service import OTPService
from services.email_service import EmailService
from utils.validators import validate_email, validate_phone, validate_password
from utils.response_helper import success_response, error_response
from utils.password_helper import hash_password
import requests as http_requests

class AuthController:

    @staticmethod
    def register_email():
        data = request.get_json()
        email = (data.get('email') or '').strip().lower()
        password = data.get('password', '')
        name = (data.get('name') or '').strip()

        if not validate_email(email):
            return error_response('Invalid email address')
        valid_pw, msg = validate_password(password)
        if not valid_pw:
            return error_response(msg)
        if not name:
            return error_response('Name is required')

        tokens, err = AuthService.register_email(email, password, name)
        if err:
            return error_response(err, status_code=409)

        EmailService.send_welcome_email(email, name)
        return success_response('Registration successful', tokens, 201)

    @staticmethod
    def login_email():
        data = request.get_json()
        email = (data.get('email') or '').strip().lower()
        password = data.get('password', '')
        ip = request.remote_addr

        if not email or not password:
            return error_response('Email and password are required')

        tokens, err = AuthService.login_email(email, password, ip)
        if err:
            return error_response(err, status_code=401)

        return success_response('Login successful', tokens)

    @staticmethod
    def refresh_token():
        data = request.get_json()
        refresh_token = data.get('refresh_token')
        if not refresh_token:
            return error_response('Refresh token required')
        tokens, err = AuthService.refresh_access_token(refresh_token)
        if err:
            return error_response(err, status_code=401)
        return success_response('Token refreshed', tokens)

    @staticmethod
    def logout():
        data = request.get_json() or {}
        AuthService.logout(data.get('refresh_token', ''))
        return success_response('Logged out successfully')

    @staticmethod
    def get_me():
        user_id = get_jwt_identity()
        user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return error_response('User not found', status_code=404)
        user['_id'] = str(user['_id'])
        user.pop('password', None)
        # Ensure avatar URL is absolute so the browser can load it cross-origin
        from flask import current_app as _app
        backend_url = _app.config.get('BACKEND_URL', 'http://127.0.0.1:5000')
        if user.get('avatar') and user['avatar'].startswith('/uploads/'):
            user['avatar'] = backend_url + user['avatar']
        return success_response('User data', user)

    @staticmethod
    def send_email_otp():
        data = request.get_json()
        email = (data.get('email') or '').strip().lower()
        otp_type = data.get('type', 'email_verify')
        if not validate_email(email):
            return error_response('Invalid email')
        otp_code = OTPService.create_otp(email, otp_type)
        EmailService.send_otp_email(email, otp_code, otp_type)
        return success_response('OTP sent to email')

    @staticmethod
    def verify_email_otp():
        data = request.get_json()
        email = (data.get('email') or '').strip().lower()
        code = data.get('otp', '')
        otp_type = data.get('type', 'email_verify')
        valid, msg = OTPService.verify_otp(email, code, otp_type)
        if not valid:
            return error_response(msg, status_code=400)
        if otp_type == 'email_verify':
            mongo.db.users.update_one({'email': email}, {'$set': {'is_verified': True}})
        return success_response(msg)

    @staticmethod
    def send_phone_otp():
        data = request.get_json()
        phone = data.get('phone', '').strip()
        if not validate_phone(phone):
            return error_response('Invalid phone number')
        otp_code = OTPService.create_otp(phone, 'phone_verify')
        # Send via Twilio (placeholder)
        return success_response('OTP sent to phone')

    @staticmethod
    def verify_phone_otp():
        data = request.get_json()
        phone = data.get('phone', '').strip()
        code = data.get('otp', '')
        valid, msg = OTPService.verify_otp(phone, code, 'phone_verify')
        if not valid:
            return error_response(msg, status_code=400)

        user = mongo.db.users.find_one({'phone': phone})
        if not user:
            from models.user_model import UserModel
            from utils.jwt_helper import generate_tokens
            from services.auth_service import AuthService
            user_data = UserModel.default('phone')
            user_data['phone'] = phone
            user_data['is_verified'] = True
            result = mongo.db.users.insert_one(user_data)
            user_id = str(result.inserted_id)
            access_token, refresh_token = generate_tokens(user_id, {'role': 'user'})
            AuthService._save_refresh_token(user_id, refresh_token)
            return success_response('Phone verified. Account created.', {'access_token': access_token, 'refresh_token': refresh_token})

        mongo.db.users.update_one({'_id': user['_id']}, {'$set': {'is_verified': True}})
        return success_response('Phone verified')

    @staticmethod
    def google_login():
        data = request.get_json()
        id_token = data.get('id_token')
        if not id_token:
            return error_response('Google ID token required')

        try:
            from flask import current_app
            client_id = current_app.config['GOOGLE_CLIENT_ID']

            # Mock fallback in development to test Google login without actual Google APIs
            if id_token.startswith('mock_token_'):
                email = id_token.replace('mock_token_', '').strip().lower()
                google_id = 'mock_google_id_' + email.split('@')[0]
                name = email.split('@')[0].capitalize()
                avatar = ''
                current_app.logger.info(f"Using development mock Google login for email: {email}")
            else:
                resp = http_requests.get(f'https://oauth2.googleapis.com/tokeninfo?id_token={id_token}', timeout=5)
                info = resp.json()
                if 'error_description' in info:
                    return error_response(f"Invalid Google token: {info['error_description']}", status_code=401)
                
                # Check aud if client_id is configured and is not a placeholder
                if client_id and client_id != 'your-google-client-id' and client_id != '':
                    if info.get('aud') != client_id:
                        return error_response('Invalid Google token audience', status_code=401)
                else:
                    current_app.logger.warning("Strict Google client ID check skipped because GOOGLE_CLIENT_ID is not configured or is placeholder.")

                google_id = info['sub']
                email = info.get('email', '').lower()
                name = info.get('name', '')
                avatar = info.get('picture', '')

            user = mongo.db.users.find_one({'$or': [{'google_id': google_id}, {'email': email}]})
            if not user:
                from models.user_model import UserModel
                user_data = UserModel.default('google')
                user_data.update({'google_id': google_id, 'email': email, 'name': name, 'avatar': avatar, 'is_verified': True})
                result = mongo.db.users.insert_one(user_data)
                user_id = str(result.inserted_id)
            else:
                user_id = str(user['_id'])
                mongo.db.users.update_one({'_id': user['_id']}, {'$set': {'google_id': google_id, 'last_seen': __import__('datetime').datetime.now(__import__('datetime').timezone.utc)}})

            from utils.jwt_helper import generate_tokens
            from services.auth_service import AuthService
            access_token, refresh_token = generate_tokens(user_id, {'role': 'user'})
            AuthService._save_refresh_token(user_id, refresh_token)
            return success_response('Google login successful', {'access_token': access_token, 'refresh_token': refresh_token})
        except Exception as e:
            return error_response(f'Google auth failed: {str(e)}', status_code=500)

    @staticmethod
    def forgot_password():
        data = request.get_json()
        email = (data.get('email') or '').strip().lower()
        if not validate_email(email):
            return error_response('Invalid email')
        user = mongo.db.users.find_one({'email': email})
        if user:
            otp_code = OTPService.create_otp(email, 'password_reset')
            EmailService.send_otp_email(email, otp_code, 'password_reset')
        return success_response('If this email exists, a reset OTP has been sent')

    @staticmethod
    def reset_password():
        data = request.get_json()
        email = (data.get('email') or '').strip().lower()
        otp_code = data.get('otp', '')
        new_password = data.get('new_password', '')
        valid, msg = OTPService.verify_otp(email, otp_code, 'password_reset')
        if not valid:
            return error_response(msg)
        valid_pw, pw_msg = validate_password(new_password)
        if not valid_pw:
            return error_response(pw_msg)
        mongo.db.users.update_one({'email': email}, {'$set': {'password': hash_password(new_password)}})
        return success_response('Password reset successful')
