from flask import Blueprint
from controllers.user_controller import UserController
from middleware.auth_middleware import jwt_required_custom

user_bp = Blueprint('users', __name__)

@user_bp.get('/profile')
@jwt_required_custom
def get_profile():
    return UserController.get_profile()

@user_bp.put('/profile')
@jwt_required_custom
def update_profile():
    return UserController.update_profile()

@user_bp.post('/avatar')
@jwt_required_custom
def upload_avatar():
    return UserController.upload_avatar()

@user_bp.delete('/account')
@jwt_required_custom
def delete_account():
    return UserController.delete_account()

@user_bp.post('/swipe')
@jwt_required_custom
def swipe_user():
    return UserController.swipe()

@user_bp.post('/photos')
@jwt_required_custom
def upload_photos():
    return UserController.upload_photos()

@user_bp.delete('/photos')
@jwt_required_custom
def delete_photo():
    return UserController.delete_photo()

@user_bp.get('/<user_id>')
@jwt_required_custom
def get_user(user_id):
    return UserController.get_user_by_id(user_id)

@user_bp.get('/stats')
def get_stats():
    return UserController.get_user_stats()
