from flask import Blueprint
from controllers.auth_controller import AuthController

phone_auth_bp = Blueprint('phone_auth', __name__)

@phone_auth_bp.post('/send-otp')
def send_otp():
    return AuthController.send_phone_otp()

@phone_auth_bp.post('/verify-otp')
def verify_phone_otp():
    return AuthController.verify_phone_otp()
