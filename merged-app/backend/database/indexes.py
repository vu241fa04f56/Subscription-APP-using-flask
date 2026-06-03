from database.mongo import mongo

def create_indexes():
    db = mongo.db
    # Users
    db.users.create_index('email', unique=True, sparse=True)
    db.users.create_index('phone', unique=True, sparse=True)
    db.users.create_index('google_id', unique=True, sparse=True)
    db.users.create_index([('location', '2dsphere')])

    # OTPs
    db.otps.create_index('expires_at', expireAfterSeconds=0)
    db.otps.create_index([('identifier', 1), ('type', 1)])

    # Subscriptions
    db.user_subscriptions.create_index('user_id')
    db.user_subscriptions.create_index('expires_at')

    # Payments
    db.payments.create_index('user_id')
    db.payments.create_index('razorpay_order_id', unique=True, sparse=True)

    # Refresh tokens
    db.refresh_tokens.create_index('expires_at', expireAfterSeconds=0)
    db.refresh_tokens.create_index('token', unique=True)

    # Chat
    db.chats.create_index([('participants', 1)])
    db.messages.create_index([('chat_id', 1), ('created_at', -1)])

    # Notifications
    db.notifications.create_index([('user_id', 1), ('read', 1)])

    # Activity logs
    db.activity_logs.create_index([('user_id', 1), ('created_at', -1)])

    # OTT
    db.ott_content.create_index([('genre', 1), ('rating', -1)])
    db.ott_content.create_index([('is_trending', -1), ('rating', -1)])
    db.ott_content.create_index([('is_new', -1), ('created_at', -1)])
    db.ott_content.create_index([('title', 'text'), ('description', 'text'), ('cast', 'text')])
    db.ott_watchlist.create_index([('user_id', 1), ('content_id', 1)], unique=True)
    db.ott_watchlist.create_index([('user_id', 1), ('added_at', -1)])
    db.ott_watch_history.create_index([('user_id', 1), ('content_id', 1)], unique=True)
    db.ott_watch_history.create_index([('user_id', 1), ('watched_at', -1)])
