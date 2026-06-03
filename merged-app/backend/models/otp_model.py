from datetime import datetime, timezone, timedelta

class OTPModel:
    COLLECTION = 'otps'
    TYPES = ['email_verify', 'phone_verify', 'password_reset', 'login']

    @staticmethod
    def create(identifier, otp_code, otp_type, expiry_minutes=10):
        now = datetime.now(timezone.utc)
        return {
            'identifier': identifier,   # email or phone
            'type': otp_type,
            'code': otp_code,
            'is_used': False,
            'attempts': 0,
            'max_attempts': 5,
            'expires_at': now + timedelta(minutes=expiry_minutes),
            'created_at': now,
        }
