import re

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')
PHONE_REGEX = re.compile(r'^\+?[1-9]\d{9,14}$')

def validate_email(email: str) -> bool:
    return bool(EMAIL_REGEX.match(email.strip())) if email else False

def validate_phone(phone: str) -> bool:
    return bool(PHONE_REGEX.match(phone.strip())) if phone else False

def validate_password(password: str) -> tuple:
    """Returns (is_valid, message)"""
    if not password or len(password) < 8:
        return False, 'Password must be at least 8 characters'
    if not re.search(r'[A-Z]', password):
        return False, 'Password must contain at least one uppercase letter'
    if not re.search(r'[a-z]', password):
        return False, 'Password must contain at least one lowercase letter'
    if not re.search(r'\d', password):
        return False, 'Password must contain at least one digit'
    return True, 'Valid'

def validate_name(name: str) -> bool:
    return bool(name and 2 <= len(name.strip()) <= 100)
