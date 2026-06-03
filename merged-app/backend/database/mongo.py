from flask_pymongo import PyMongo

mongo = PyMongo()

def init_db(app):
    mongo.init_app(app)
    return mongo

def get_db():
    from flask import current_app
    from flask_pymongo import PyMongo
    return mongo.db
