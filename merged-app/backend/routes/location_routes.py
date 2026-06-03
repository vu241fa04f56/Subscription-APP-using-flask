from flask import Blueprint, request
from middleware.auth_middleware import jwt_required_custom
from flask_jwt_extended import get_jwt_identity
from database.mongo import mongo
from models.user_location_model import UserLocationModel
from utils.response_helper import success_response, error_response
from bson import ObjectId

location_bp = Blueprint('location', __name__)

@location_bp.post('/update')
@jwt_required_custom
def update_location():
    user_id = get_jwt_identity()
    data = request.get_json()
    lat = data.get('latitude')
    lng = data.get('longitude')
    if lat is None or lng is None:
        return error_response('latitude and longitude are required')

    city = data.get('city')
    country = data.get('country')

    if not city or not country:
        try:
            from geopy.geocoders import Nominatim
            geolocator = Nominatim(user_agent="subspace_platform")
            location = geolocator.reverse((lat, lng), timeout=5)
            if location and location.raw and 'address' in location.raw:
                address = location.raw['address']
                city = city or address.get('city') or address.get('town') or address.get('village') or address.get('suburb') or address.get('county')
                country = country or address.get('country')
        except Exception:
            pass

    loc_doc = UserLocationModel.create(user_id, lat, lng, city, country)
    mongo.db.users.update_one({'_id': ObjectId(user_id)}, {
        '$set': {
            'location': loc_doc['location'],
            'city': loc_doc.get('city'),
            'country': loc_doc.get('country'),
        }
    })
    return success_response('Location updated', {
        'city': loc_doc.get('city') or 'Unknown',
        'country': loc_doc.get('country') or 'Unknown'
    })
