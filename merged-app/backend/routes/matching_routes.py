from flask import Blueprint
from controllers.matching_controller import MatchingController
from middleware.auth_middleware import jwt_required_custom

discover_bp = Blueprint('discover', __name__)

@discover_bp.get('/matches')
@jwt_required_custom
def get_matches():
    return MatchingController.get_matches()

@discover_bp.get('/nearby')
@jwt_required_custom
def nearby():
    return MatchingController.get_nearby()
