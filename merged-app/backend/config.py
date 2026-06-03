import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Core
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-prod')
    DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
    TESTING = False

    # MongoDB
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/subspace_db')
    MONGO_DB_NAME = os.environ.get('MONGO_DB_NAME', 'subspace_db')

    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-change-in-prod')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 3600)))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(seconds=int(os.environ.get('JWT_REFRESH_TOKEN_EXPIRES', 2592000)))
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'

    # Razorpay
    RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
    RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')

    # Email (SendGrid)
    SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
    EMAIL_FROM = os.environ.get('EMAIL_FROM', 'noreply@subspace.com')
    EMAIL_FROM_NAME = os.environ.get('EMAIL_FROM_NAME', 'Subspace Platform')

    # Email (SMTP Fallback)
    SMTP_SERVER = os.environ.get('SMTP_SERVER', '')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
    SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
    SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
    SMTP_USE_TLS = os.environ.get('SMTP_USE_TLS', 'True').lower() == 'true'
    SMTP_USE_SSL = os.environ.get('SMTP_USE_SSL', 'False').lower() == 'true'

    # Twilio SMS
    TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
    TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
    TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '')

    # Google OAuth
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')

    # Redis
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

    # App
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    BACKEND_URL  = os.environ.get('BACKEND_URL',  'http://localhost:5000')
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

    # OTP
    OTP_EXPIRY_MINUTES = 10
    OTP_LENGTH = 6

    # Geo
    MAX_NEARBY_DISTANCE_KM = float(os.environ.get('MAX_NEARBY_DISTANCE_KM', 50))

    # CORS — build allowed origins from FRONTEND_URL env var
    # In production, set FRONTEND_URL=https://your-frontend.onrender.com
    # Multiple origins supported: FRONTEND_URL=https://a.com,https://b.com
    @classmethod
    def get_cors_origins(cls):
        env_origins = [o.strip() for o in os.environ.get('FRONTEND_URL', 'http://localhost:3000').split(',') if o.strip()]
        local_dev = [
            'http://localhost:3000', 'http://127.0.0.1:3000',
            'http://localhost:5500', 'http://127.0.0.1:5500',
            'http://localhost:8080', 'http://127.0.0.1:8080',
        ]
        combined = list(dict.fromkeys(env_origins + local_dev))
        return combined

    CORS_ORIGINS = property(lambda self: self.__class__.get_cors_origins())


class DevelopmentConfig(Config):
    DEBUG = True
    CORS_ORIGINS = Config.get_cors_origins()


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    # In production, only allow origins from FRONTEND_URL (no local dev origins)
    @classmethod
    def get_cors_origins(cls):
        env_origins = [o.strip() for o in os.environ.get('FRONTEND_URL', '').split(',') if o.strip()]
        return env_origins if env_origins else ['*']

    CORS_ORIGINS = property(lambda self: ProductionConfig.get_cors_origins())


class TestingConfig(Config):
    TESTING = True
    MONGO_URI = 'mongodb://localhost:27017/subspace_test_db'
    CORS_ORIGINS = ['*']


config_map = {
    'development': DevelopmentConfig,
    'production':  ProductionConfig,
    'testing':     TestingConfig,
    'default':     DevelopmentConfig,
}

def get_config():
    env = os.environ.get('FLASK_ENV', 'development')
    cfg_class = config_map.get(env, config_map['default'])
    cfg = cfg_class()
    # Resolve CORS_ORIGINS if it's a property
    if isinstance(cfg.CORS_ORIGINS, property):
        cfg.CORS_ORIGINS = cfg_class.get_cors_origins()
    return cfg
