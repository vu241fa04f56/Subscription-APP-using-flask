from datetime import datetime, timezone
from bson import ObjectId

class ChatModel:
    COLLECTION = 'chats'

    @staticmethod
    def create(participant_ids):
        now = datetime.now(timezone.utc)
        return {
            'participants': [ObjectId(p) if isinstance(p, str) else p for p in participant_ids],
            'last_message': None,
            'last_message_at': now,
            'unread_counts': {str(p): 0 for p in participant_ids},
            'created_at': now,
            'updated_at': now,
        }

class MessageModel:
    COLLECTION = 'messages'

    @staticmethod
    def create(chat_id, sender_id, content, msg_type='text'):
        now = datetime.now(timezone.utc)
        return {
            'chat_id': ObjectId(chat_id) if isinstance(chat_id, str) else chat_id,
            'sender_id': ObjectId(sender_id) if isinstance(sender_id, str) else sender_id,
            'content': content,
            'type': msg_type,   # text, image, file
            'read_by': [],
            'delivered_to': [],
            'deleted': False,
            'created_at': now,
        }
