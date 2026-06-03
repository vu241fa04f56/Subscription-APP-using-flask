from flask import request
from flask_jwt_extended import get_jwt_identity
from services.matching_service import MatchingService
from utils.response_helper import success_response, error_response

class MatchingController:

    @staticmethod
    def get_matches():
        user_id = get_jwt_identity()
        limit = int(request.args.get('limit', 10))
        
        radius_str = request.args.get('radius')
        radius = None
        if radius_str:
            if radius_str == 'infinite' or radius_str == '5000+':
                radius = -1
            else:
                try:
                    radius = float(radius_str)
                except ValueError:
                    pass
                    
        matches = MatchingService.get_matches(user_id, limit, radius)
        return success_response('Matches fetched', matches)

    @staticmethod
    def get_nearby():
        user_id = get_jwt_identity()
        try:
            lat = float(request.args.get('lat'))
            lng = float(request.args.get('lng'))
        except (TypeError, ValueError):
            return error_response('lat and lng query parameters required')
        
        radius_str = request.args.get('radius', '50')
        if radius_str == 'infinite' or radius_str == '-1':
            radius = -1
        else:
            try:
                radius = float(radius_str)
            except ValueError:
                radius = 50
                
        users = MatchingService.get_nearby_users(user_id, lat, lng, radius)
        return success_response('Nearby users fetched', users)
