from flask import Blueprint
from controllers.auth_controller import AuthController

email_auth_bp = Blueprint('email_auth', __name__)

@email_auth_bp.post('/register')
def register():
    return AuthController.register_email()

@email_auth_bp.post('/login')
def login():
    return AuthController.login_email()

@email_auth_bp.post('/send-otp')
def send_otp():
    return AuthController.send_email_otp()

@email_auth_bp.post('/verify-otp')
def verify_otp():
    return AuthController.verify_email_otp()

@email_auth_bp.post('/forgot-password')
def forgot_password():
    return AuthController.forgot_password()

@email_auth_bp.post('/reset-password')
def reset_password():
    return AuthController.reset_password()
