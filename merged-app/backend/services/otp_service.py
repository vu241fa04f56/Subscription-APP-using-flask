from datetime import datetime, timezone
from database.mongo import mongo
from models.otp_model import OTPModel
from utils.otp_generator import generate_otp

class OTPService:

    @staticmethod
    def create_otp(identifier: str, otp_type: str) -> str:
        # Invalidate old OTPs
        mongo.db.otps.update_many(
            {'identifier': identifier, 'type': otp_type, 'is_used': False},
            {'$set': {'is_used': True}}
        )
        code = generate_otp(6)
        otp_doc = OTPModel.create(identifier, code, otp_type)
        mongo.db.otps.insert_one(otp_doc)
        return code

    @staticmethod
    def verify_otp(identifier: str, code: str, otp_type: str) -> tuple:
        now = datetime.now(timezone.utc)
        otp_doc = mongo.db.otps.find_one({
            'identifier': identifier,
            'type': otp_type,
            'is_used': False,
            'expires_at': {'$gt': now}
        })
        if not otp_doc:
            return False, 'OTP expired or not found'

        mongo.db.otps.update_one({'_id': otp_doc['_id']}, {'$inc': {'attempts': 1}})

        if otp_doc['attempts'] >= otp_doc.get('max_attempts', 5):
            mongo.db.otps.update_one({'_id': otp_doc['_id']}, {'$set': {'is_used': True}})
            return False, 'Too many attempts. Request a new OTP'

        if otp_doc['code'] != code:
            return False, 'Invalid OTP'

        mongo.db.otps.update_one({'_id': otp_doc['_id']}, {'$set': {'is_used': True}})
        return True, 'OTP verified successfully'
