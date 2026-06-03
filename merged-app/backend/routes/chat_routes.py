from flask import Blueprint
from controllers.chat_controller import ChatController
from middleware.auth_middleware import jwt_required_custom

chat_bp = Blueprint('chat', __name__)

@chat_bp.get('/conversations')
@jwt_required_custom
def conversations():
    return ChatController.get_conversations()

@chat_bp.post('/conversations')
@jwt_required_custom
def create_conversation():
    return ChatController.create_conversation()

@chat_bp.get('/conversations/<chat_id>/messages')
@jwt_required_custom
def messages(chat_id):
    return ChatController.get_messages(chat_id)

@chat_bp.post('/conversations/<chat_id>/messages')
@jwt_required_custom
def send_message(chat_id):
    return ChatController.send_message(chat_id)

@chat_bp.delete('/conversations/<chat_id>/messages/<msg_id>')
@jwt_required_custom
def delete_message(chat_id, msg_id):
    return ChatController.delete_message(chat_id, msg_id)

@chat_bp.post('/conversations/<chat_id>/read')
@jwt_required_custom
def mark_read(chat_id):
    return ChatController.mark_read(chat_id)
