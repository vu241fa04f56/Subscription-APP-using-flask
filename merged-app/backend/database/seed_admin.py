"""
Run this script once to create the default admin user.
Usage: python seed_admin.py
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timezone
from dotenv import load_dotenv
load_dotenv()

from app import create_app
from database.mongo import mongo
from utils.password_helper import hash_password

def seed_admin():
    app = create_app()
    with app.app_context():
        admin_email = os.environ.get('ADMIN_EMAIL', 'admin@subspace.com')
        admin_password = os.environ.get('ADMIN_PASSWORD', 'Admin@123456')

        existing = mongo.db.admins.find_one({'email': admin_email})
        if existing:
            # Ensure existing admin has permissions set
            mongo.db.admins.update_one(
                {'email': admin_email},
                {'$set': {'permissions': ['all'], 'role': 'super_admin', 'is_active': True}}
            )
            print(f"Admin already exists, permissions updated: {admin_email}")
            return

        admin = {
            'email': admin_email,
            'password': hash_password(admin_password),
            'name': 'Super Admin',
            'role': 'super_admin',
            'permissions': ['all'],
            'is_active': True,
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
        }
        mongo.db.admins.insert_one(admin)
        print(f"Admin created: {admin_email}")

if __name__ == '__main__':
    seed_admin()
