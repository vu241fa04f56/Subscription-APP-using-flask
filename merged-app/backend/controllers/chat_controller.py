from flask import request
from flask_jwt_extended import get_jwt_identity
from bson import ObjectId
from database.mongo import mongo
from models.chat_model import ChatModel, MessageModel
from utils.response_helper import success_response, error_response
from datetime import datetime, timezone

class ChatController:

    @staticmethod
    def get_conversations():
        user_id = get_jwt_identity()
        chats = list(mongo.db.chats.find({'participants': ObjectId(user_id)}).sort('last_message_at', -1))
        result = []
        for c in chats:
            c['_id'] = str(c['_id'])
            c['participants'] = [str(p) for p in c['participants']]
            if c.get('last_message_at'):
                c['last_message_at'] = c['last_message_at'].isoformat() + 'Z'
            if c.get('created_at'):
                c['created_at'] = c['created_at'].isoformat() + 'Z'
            if c.get('updated_at'):
                c['updated_at'] = c['updated_at'].isoformat() + 'Z'
            
            # Populate other user profile details
            other_id = next((p for p in c['participants'] if p != user_id), None)
            if other_id:
                other_user = mongo.db.users.find_one({'_id': ObjectId(other_id)}, {'name': 1, 'avatar': 1, 'last_seen': 1, 'show_last_seen': 1})
                if other_user:
                    show_ls = other_user.get('show_last_seen', True)
                    ls_val = None
                    if show_ls and other_user.get('last_seen'):
                        ls_val = other_user['last_seen'].isoformat() + 'Z'
                    c['other_user'] = {
                        'name': other_user.get('name', 'User'),
                        'avatar': other_user.get('avatar', ''),
                        'show_last_seen': show_ls,
                        'last_seen': ls_val
                    }
            result.append(c)
        return success_response('Conversations fetched', result)

    @staticmethod
    def create_conversation():
        user_id = get_jwt_identity()
        data = request.get_json()
        other_id = data.get('user_id')
        if not other_id:
            return error_response('Target user ID required')
            
        # Check if conversation already exists in database
        existing = mongo.db.chats.find_one({'participants': {'$all': [ObjectId(user_id), ObjectId(other_id)]}})
        if existing:
            existing['_id'] = str(existing['_id'])
            existing['participants'] = [str(p) for p in existing['participants']]
            return success_response('Conversation exists', existing)

        chat_doc = ChatModel.create([user_id, other_id])
        result = mongo.db.chats.insert_one(chat_doc)
        return success_response('Conversation created', {'chat_id': str(result.inserted_id)}, 201)

    @staticmethod
    def get_messages(chat_id):
        user_id = get_jwt_identity()
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 30))
        chat = mongo.db.chats.find_one({'_id': ObjectId(chat_id), 'participants': ObjectId(user_id)})
        if not chat:
            return error_response('Conversation not found', status_code=404)
            
        # Mark messages sent by the other participant as delivered to current user
        mongo.db.messages.update_many(
            {'chat_id': ObjectId(chat_id), 'sender_id': {'$ne': ObjectId(user_id)}},
            {'$addToSet': {'delivered_to': ObjectId(user_id)}}
        )
        
        skip = (page - 1) * per_page
        messages = list(mongo.db.messages.find({'chat_id': ObjectId(chat_id), 'deleted': False}).sort('created_at', -1).skip(skip).limit(per_page))
        for m in messages:
            m['_id'] = str(m['_id'])
            m['chat_id'] = str(m['chat_id'])
            m['sender_id'] = str(m['sender_id'])
            if m.get('created_at'):
                m['created_at'] = m['created_at'].isoformat() + 'Z'
            # Convert list of ObjectIds to strings
            if m.get('read_by'):
                m['read_by'] = [str(r) for r in m['read_by']]
            if m.get('delivered_to'):
                m['delivered_to'] = [str(d) for d in m['delivered_to']]
        return success_response('Messages fetched', messages[::-1])

    @staticmethod
    def send_message(chat_id):
        user_id = get_jwt_identity()
        data = request.get_json()
        content = data.get('content', '').strip()
        msg_type = data.get('type', 'text')
        if not content:
            return error_response('Message content required')
        chat = mongo.db.chats.find_one({'_id': ObjectId(chat_id), 'participants': ObjectId(user_id)})
        if not chat:
            return error_response('Conversation not found', status_code=404)
            
        # Get the other participant ID
        other_id = next((p for p in chat['participants'] if p != ObjectId(user_id)), None)
        is_mutual = False
        if other_id:
            # Check if matched from both sides
            like_1 = mongo.db.user_swipes.find_one({'user_id': ObjectId(user_id), 'target_id': other_id, 'action': 'like'})
            like_2 = mongo.db.user_swipes.find_one({'user_id': other_id, 'target_id': ObjectId(user_id), 'action': 'like'})
            if like_1 and like_2:
                is_mutual = True
                
        if not is_mutual:
            # Check if current user has already sent 3 messages in this conversation
            sent_count = mongo.db.messages.count_documents({
                'chat_id': ObjectId(chat_id),
                'sender_id': ObjectId(user_id),
                'deleted': False
            })
            if sent_count >= 3:
                return error_response('You can only send up to 3 messages before a mutual match is established.', status_code=403)
                
        msg_doc = MessageModel.create(chat_id, user_id, content, msg_type)
        result = mongo.db.messages.insert_one(msg_doc)
        now = datetime.now(timezone.utc)
        mongo.db.chats.update_one({'_id': ObjectId(chat_id)}, {
            '$set': {'last_message': content, 'last_message_at': now, 'updated_at': now}
        })
        return success_response('Message sent', {'message_id': str(result.inserted_id)}, 201)

    @staticmethod
    def delete_message(chat_id, msg_id):
        user_id = get_jwt_identity()
        mongo.db.messages.update_one(
            {'_id': ObjectId(msg_id), 'sender_id': ObjectId(user_id)},
            {'$set': {'deleted': True}}
        )
        return success_response('Message deleted')

    @staticmethod
    def mark_read(chat_id):
        user_id = get_jwt_identity()
        mongo.db.messages.update_many(
            {'chat_id': ObjectId(chat_id), 'sender_id': {'$ne': ObjectId(user_id)}},
            {'$addToSet': {'read_by': ObjectId(user_id)}}
        )
        return success_response('Marked as read')
