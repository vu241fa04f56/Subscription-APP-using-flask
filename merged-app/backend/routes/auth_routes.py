from flask import Blueprint, request
from controllers.auth_controller import AuthController
from middleware.auth_middleware import jwt_required_custom

auth_bp = Blueprint('auth', __name__)

@auth_bp.post('/refresh')
def refresh():
    return AuthController.refresh_token()

@auth_bp.post('/logout')
@jwt_required_custom
def logout():
    return AuthController.logout()

@auth_bp.get('/me')
@jwt_required_custom
def me():
    return AuthController.get_me()
