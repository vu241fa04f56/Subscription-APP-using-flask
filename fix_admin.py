import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'merged-app', 'backend'))
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'merged-app', 'backend'))
from dotenv import load_dotenv
load_dotenv()
from app import create_app
from database.mongo import mongo

app = create_app()
with app.app_context():
    # Print current admin docs
    admins = list(mongo.db.admins.find({}))
    for a in admins:
        print('BEFORE:', {k:v for k,v in a.items() if k != 'password'})
    
    # Force-set permissions regardless
    mongo.db.admins.update_many(
        {},
        {'$set': {'permissions': ['all'], 'role': 'super_admin', 'is_active': True}}
    )
    
    # Verify
    admins2 = list(mongo.db.admins.find({}))
    for a in admins2:
        print('AFTER: ', {k:v for k,v in a.items() if k != 'password'})
