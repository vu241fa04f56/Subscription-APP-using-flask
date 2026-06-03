from flask import Blueprint
from controllers.admin_controller import AdminController
from middleware.admin_middleware import admin_required

admin_bp = Blueprint('admin', __name__)

@admin_bp.post('/login')
def login():
    return AdminController.login()

@admin_bp.get('/dashboard')
@admin_required()
def dashboard():
    return AdminController.dashboard()

@admin_bp.get('/users')
@admin_required('users.read')
def users():
    return AdminController.list_users()

@admin_bp.get('/users/<user_id>')
@admin_required('users.read')
def user_detail(user_id):
    return AdminController.user_detail(user_id)

@admin_bp.post('/users/<user_id>/ban')
@admin_required('users.ban')
def ban_user(user_id):
    return AdminController.ban_user(user_id)

@admin_bp.post('/users/<user_id>/unban')
@admin_required('users.ban')
def unban_user(user_id):
    return AdminController.unban_user(user_id)

@admin_bp.get('/subscriptions')
@admin_required()
def subscriptions():
    return AdminController.list_subscriptions()

@admin_bp.get('/payments')
@admin_required()
def payments():
    return AdminController.list_payments()

@admin_bp.post('/plans')
@admin_required()
def create_plan():
    return AdminController.create_plan()

@admin_bp.get('/plans')
@admin_required()
def list_plans():
    return AdminController.list_plans()

@admin_bp.put('/plans/<plan_id>')
@admin_required()
def update_plan(plan_id):
    return AdminController.update_plan(plan_id)

@admin_bp.delete('/plans/<plan_id>')
@admin_required()
def delete_plan(plan_id):
    return AdminController.delete_plan(plan_id)
