import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO

from config import get_config
from database.mongo import init_db
from database.indexes import create_indexes
from utils.response_helper import error_response

socketio = SocketIO()
jwt = JWTManager()

def create_app():
    frontend_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))
    app = Flask(__name__, static_folder=frontend_folder, static_url_path='')
    cfg = get_config()
    app.config.from_object(cfg)

    # Diagnostic Startup Logs
    mongo_uri = cfg.MONGO_URI or ''
    masked_uri = mongo_uri
    if '@' in mongo_uri:
        try:
            parts = mongo_uri.split('@')
            scheme_part = parts[0].split('://')
            scheme = scheme_part[0] + '://' if len(scheme_part) > 1 else ''
            masked_uri = f"{scheme}***@{parts[1]}"
        except Exception:
            masked_uri = "invalid-uri-format"
    app.logger.info(f"Starting application: FLASK_ENV={os.environ.get('FLASK_ENV', 'development')}, MONGO_URI={masked_uri}")

    # Extensions
    CORS(app, origins=cfg.CORS_ORIGINS, supports_credentials=True)
    jwt.init_app(app)
    socketio.init_app(app, cors_allowed_origins=cfg.CORS_ORIGINS, async_mode='eventlet')

    # Global Exception Handler
    @app.errorhandler(Exception)
    def handle_exception(e):
        status_code = getattr(e, 'code', 500)
        if status_code == 500:
            app.logger.error(f"Unhandled exception occurred: {e}", exc_info=True)
            message = f"Internal Server Error: {str(e)}"
        else:
            app.logger.warning(f"HTTP Exception ({status_code}): {e}")
            message = getattr(e, 'description', str(e))
        return error_response(message=message, status_code=status_code)

    # Database
    init_db(app)
    with app.app_context():
        create_indexes()

    # ── Serve uploaded files (avatars, photos) ─────────────────────────────
    upload_folder = os.path.abspath(app.config.get('UPLOAD_FOLDER', 'uploads'))
    os.makedirs(upload_folder, exist_ok=True)

    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(upload_folder, filename)

    # Register blueprints
    from routes.auth_routes import auth_bp
    from routes.email_auth_routes import email_auth_bp
    from routes.phone_auth_routes import phone_auth_bp
    from routes.google_auth_routes import google_auth_bp
    from routes.user_routes import user_bp
    from routes.subscription_routes import subscription_bp
    from routes.payment_routes import payment_bp
    from routes.admin_routes import admin_bp
    from routes.chat_routes import chat_bp
    from routes.matching_routes import discover_bp
    from routes.notification_routes import notification_bp
    from routes.analytics_routes import analytics_bp
    from routes.location_routes import location_bp
    from routes.ott_routes import ott_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(email_auth_bp, url_prefix='/api/auth/email')
    app.register_blueprint(phone_auth_bp, url_prefix='/api/auth/phone')
    app.register_blueprint(google_auth_bp, url_prefix='/api/auth/google')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(subscription_bp, url_prefix='/api/subscriptions')
    app.register_blueprint(payment_bp, url_prefix='/api/payments')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(discover_bp, url_prefix='/api/discover')
    app.register_blueprint(notification_bp, url_prefix='/api/notifications')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(location_bp, url_prefix='/api/location')
    app.register_blueprint(ott_bp, url_prefix='/api/ott')

    # Start scheduler
    from scheduler.renewal_scheduler import start_scheduler
    start_scheduler(app)

    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'version': '1.0.0'}

    @app.route('/')
    def index():
        return send_from_directory(app.static_folder, 'index.html')

    return app


app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '127.0.0.1')
    socketio.run(app, host=host, port=port, debug=app.config.get('DEBUG', False))
