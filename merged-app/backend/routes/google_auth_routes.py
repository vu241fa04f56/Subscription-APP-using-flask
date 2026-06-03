from flask import Blueprint
from controllers.auth_controller import AuthController

google_auth_bp = Blueprint('google_auth', __name__)

@google_auth_bp.post('/login')
def google_login():
    return AuthController.google_login()

@google_auth_bp.get('/config')
def google_config():
    from flask import current_app
    return {
        'success': True,
        'google_client_id': current_app.config.get('GOOGLE_CLIENT_ID', '')
    }
