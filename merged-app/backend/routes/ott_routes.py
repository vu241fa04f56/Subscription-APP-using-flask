"""
OTT Routes — Subspace Platform
Mount at: /api/ott
"""
from flask import Blueprint
from controllers.ott_controller import OTTController
from middleware.auth_middleware import jwt_required_custom

ott_bp = Blueprint('ott', __name__)


# ── Content library ──────────────────────────────────────────────────

@ott_bp.get('/content')
@jwt_required_custom
def get_content(current_user):
    """List all content, optionally filtered by genre/type."""
    return OTTController.get_content(current_user)


@ott_bp.get('/content/<content_id>')
@jwt_required_custom
def get_content_item(current_user, content_id):
    """Get a single content item by ID."""
    return OTTController.get_content_item(current_user, content_id)


@ott_bp.get('/content/search')
@jwt_required_custom
def search_content(current_user):
    """Full-text search. ?q=query"""
    return OTTController.search_content(current_user)


@ott_bp.get('/trending')
@jwt_required_custom
def get_trending(current_user):
    return OTTController.get_trending(current_user)


@ott_bp.get('/new-releases')
@jwt_required_custom
def get_new_releases(current_user):
    return OTTController.get_new_releases(current_user)


# ── Watchlist ─────────────────────────────────────────────────────────

@ott_bp.get('/watchlist')
@jwt_required_custom
def get_watchlist(current_user):
    return OTTController.get_watchlist(current_user)


@ott_bp.post('/watchlist')
@jwt_required_custom
def add_to_watchlist(current_user):
    return OTTController.add_to_watchlist(current_user)


@ott_bp.delete('/watchlist/<content_id>')
@jwt_required_custom
def remove_from_watchlist(current_user, content_id):
    return OTTController.remove_from_watchlist(current_user, content_id)


# ── Watch history & progress ──────────────────────────────────────────

@ott_bp.get('/watch-history')
@jwt_required_custom
def get_watch_history(current_user):
    return OTTController.get_watch_history(current_user)


@ott_bp.post('/watch-history')
@jwt_required_custom
def save_watch_progress(current_user):
    return OTTController.save_watch_progress(current_user)


# ── Recommendations ───────────────────────────────────────────────────

@ott_bp.get('/recommended')
@jwt_required_custom
def get_recommendations(current_user):
    return OTTController.get_recommendations(current_user)


# ── Admin / seed ──────────────────────────────────────────────────────

@ott_bp.post('/seed')
@jwt_required_custom
def seed_content(current_user):
    """Seed demo content into the database (admin only)."""
    return OTTController.seed_content(current_user)
