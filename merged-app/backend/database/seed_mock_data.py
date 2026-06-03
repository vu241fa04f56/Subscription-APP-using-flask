"""
Seed script to create mock subscription plans, mock users, payments, and subscriptions.
Usage: python database/seed_mock_data.py
"""
import os
import sys
from datetime import datetime, timezone, timedelta
from bson import ObjectId

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app import create_app
from database.mongo import mongo
from utils.password_helper import hash_password
from models.subscription_plan_model import SubscriptionPlanModel

def seed_mock_data():
    app = create_app()
    with app.app_context():
        # 1. Seed subscription plans
        mongo.db.subscription_plans.drop()
        plan_ids = {}
        for plan_def in SubscriptionPlanModel.SAMPLE_PLANS:
            existing = mongo.db.subscription_plans.find_one({'slug': plan_def['slug']})
            if existing:
                plan_ids[plan_def['slug']] = existing['_id']
                print(f"Plan {plan_def['name']} already exists.")
            else:
                plan_doc = {
                    'name': plan_def['name'],
                    'slug': plan_def['slug'],
                    'price': plan_def['price'],
                    'currency': plan_def['currency'],
                    'interval': plan_def['interval'],
                    'features': plan_def['features'],
                    'limits': plan_def['limits'],
                    'is_free': plan_def['is_free'],
                    'trial_days': plan_def['trial_days'],
                    'is_active': True,
                    'sort_order': 0,
                    'created_at': datetime.now(timezone.utc),
                    'updated_at': datetime.now(timezone.utc)
                }
                res = mongo.db.subscription_plans.insert_one(plan_doc)
                plan_ids[plan_def['slug']] = res.inserted_id
                print(f"Created Plan: {plan_def['name']}")

        # 2. Seed Mock Users
        users = [
            {
                'email': 'john@example.com',
                'password': hash_password('User@123456'),
                'name': 'John Doe',
                'is_active': True,
                'is_premium': True,
                'interests': ['Tech', 'Startups', 'Coding'],
                'location': {
                    'type': 'Point',
                    'coordinates': [77.2090, 28.6139] # Delhi longitude, latitude
                },
                'city': 'Delhi',
                'country': 'India',
                'created_at': datetime.now(timezone.utc),
                'updated_at': datetime.now(timezone.utc)
            },
            {
                'email': 'jane@example.com',
                'password': hash_password('User@123456'),
                'name': 'Jane Smith',
                'is_active': True,
                'is_premium': True,
                'interests': ['Design', 'Product', 'UX', 'Startups'],
                'location': {
                    'type': 'Point',
                    'coordinates': [77.3910, 28.5355] # Noida longitude, latitude
                },
                'city': 'Noida',
                'country': 'India',
                'created_at': datetime.now(timezone.utc),
                'updated_at': datetime.now(timezone.utc)
            }
        ]

        user_ids = []
        for user_def in users:
            existing = mongo.db.users.find_one({'email': user_def['email']})
            if existing:
                # Update existing user to include location and interests
                mongo.db.users.update_one({'_id': existing['_id']}, {
                    '$set': {
                        'location': user_def['location'],
                        'city': user_def['city'],
                        'country': user_def['country'],
                        'interests': user_def['interests'],
                        'is_premium': True,
                        'is_active': True
                    }
                })
                user_ids.append(existing['_id'])
                print(f"Updated User {user_def['email']} location & interests.")
            else:
                res = mongo.db.users.insert_one(user_def)
                user_ids.append(res.inserted_id)
                print(f"Created User: {user_def['email']}")

        # 3. Seed Payments and Subscriptions for mock users
        # John Doe -> Pro Plan (499 INR)
        pro_plan_id = plan_ids.get('pro')
        user_1_id = user_ids[0]
        
        existing_pay = mongo.db.payments.find_one({'user_id': user_1_id})
        if not existing_pay:
            pay_doc = {
                'user_id': user_1_id,
                'plan_id': pro_plan_id,
                'amount': 49900,  # 499 INR in paise
                'currency': 'INR',
                'status': 'captured',
                'razorpay_order_id': 'order_mock_1',
                'razorpay_payment_id': 'pay_mock_1',
                'razorpay_signature': 'sig_mock_1',
                'invoice_url': None,
                'metadata': {},
                'created_at': datetime.now(timezone.utc) - timedelta(days=2),
                'updated_at': datetime.now(timezone.utc) - timedelta(days=2),
            }
            res_pay = mongo.db.payments.insert_one(pay_doc)
            
            sub_doc = {
                'user_id': user_1_id,
                'plan_id': pro_plan_id,
                'payment_id': res_pay.inserted_id,
                'status': 'active',
                'auto_renew': True,
                'starts_at': datetime.now(timezone.utc) - timedelta(days=2),
                'expires_at': datetime.now(timezone.utc) + timedelta(days=28),
                'cancelled_at': None,
                'created_at': datetime.now(timezone.utc) - timedelta(days=2),
                'updated_at': datetime.now(timezone.utc) - timedelta(days=2),
            }
            res_sub = mongo.db.user_subscriptions.insert_one(sub_doc)
            
            mongo.db.users.update_one({'_id': user_1_id}, {
                '$set': {
                    'subscription_id': res_sub.inserted_id,
                    'is_premium': True
                }
            })
            print("Seeded payment & subscription for John Doe")

        # Jane Smith -> Elite Plan (999 INR)
        elite_plan_id = plan_ids.get('elite')
        user_2_id = user_ids[1]
        
        existing_pay_2 = mongo.db.payments.find_one({'user_id': user_2_id})
        if not existing_pay_2:
            pay_doc_2 = {
                'user_id': user_2_id,
                'plan_id': elite_plan_id,
                'amount': 99900,  # 999 INR in paise
                'currency': 'INR',
                'status': 'captured',
                'razorpay_order_id': 'order_mock_2',
                'razorpay_payment_id': 'pay_mock_2',
                'razorpay_signature': 'sig_mock_2',
                'invoice_url': None,
                'metadata': {},
                'created_at': datetime.now(timezone.utc) - timedelta(days=5),
                'updated_at': datetime.now(timezone.utc) - timedelta(days=5),
            }
            res_pay_2 = mongo.db.payments.insert_one(pay_doc_2)
            
            sub_doc_2 = {
                'user_id': user_2_id,
                'plan_id': elite_plan_id,
                'payment_id': res_pay_2.inserted_id,
                'status': 'active',
                'auto_renew': True,
                'starts_at': datetime.now(timezone.utc) - timedelta(days=5),
                'expires_at': datetime.now(timezone.utc) + timedelta(days=25),
                'cancelled_at': None,
                'created_at': datetime.now(timezone.utc) - timedelta(days=5),
                'updated_at': datetime.now(timezone.utc) - timedelta(days=5),
            }
            res_sub_2 = mongo.db.user_subscriptions.insert_one(sub_doc_2)
            
            mongo.db.users.update_one({'_id': user_2_id}, {
                '$set': {
                    'subscription_id': res_sub_2.inserted_id,
                    'is_premium': True
                }
            })
            print("Seeded payment & subscription for Jane Smith")

if __name__ == '__main__':
    seed_mock_data()
