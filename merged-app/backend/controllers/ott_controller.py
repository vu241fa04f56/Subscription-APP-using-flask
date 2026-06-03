"""
OTT Controller — Subspace Platform
"""
from flask import request, jsonify
from services.ott_service import OTTService


def success(data, **kwargs):
    return jsonify({'success': True, 'data': data, **kwargs}), 200


def error(msg, code=400):
    return jsonify({'success': False, 'message': msg}), code


class OTTController:

    # ── Content ──────────────────────────────────────────────────────

    @staticmethod
    def get_content(current_user):
        genre        = request.args.get('genre')
        content_type = request.args.get('type')
        limit        = int(request.args.get('limit', 100))
        skip         = int(request.args.get('skip', 0))
        try:
            items = OTTService.get_all_content(genre=genre, content_type=content_type,
                                               limit=limit, skip=skip)
            return success(items)
        except Exception as e:
            return error(str(e), 500)

    @staticmethod
    def get_content_item(current_user, content_id):
        item = OTTService.get_content_by_id(content_id)
        if not item:
            return error('Content not found', 404)
        return success(item)

    @staticmethod
    def search_content(current_user):
        q = request.args.get('q', '').strip()
        if not q:
            return error('Query required')
        limit = int(request.args.get('limit', 20))
        try:
            results = OTTService.search_content(q, limit=limit)
            return success(results)
        except Exception as e:
            return error(str(e), 500)

    @staticmethod
    def get_trending(current_user):
        try:
            items = OTTService.get_trending()
            return success(items)
        except Exception as e:
            return error(str(e), 500)

    @staticmethod
    def get_new_releases(current_user):
        try:
            items = OTTService.get_new_releases()
            return success(items)
        except Exception as e:
            return error(str(e), 500)

    # ── Watchlist ─────────────────────────────────────────────────────

    @staticmethod
    def get_watchlist(current_user):
        user_id = str(current_user['_id'])
        try:
            items = OTTService.get_watchlist(user_id)
            return success(items)
        except Exception as e:
            return error(str(e), 500)

    @staticmethod
    def add_to_watchlist(current_user):
        user_id = str(current_user['_id'])
        data = request.get_json() or {}
        content_id = data.get('content_id', '').strip()
        if not content_id:
            return error('content_id required')
        try:
            result = OTTService.add_to_watchlist(user_id, content_id)
            return success(result)
        except Exception as e:
            return error(str(e), 500)

    @staticmethod
    def remove_from_watchlist(current_user, content_id):
        user_id = str(current_user['_id'])
        try:
            result = OTTService.remove_from_watchlist(user_id, content_id)
            return success(result)
        except Exception as e:
            return error(str(e), 500)

    # ── Watch History ─────────────────────────────────────────────────

    @staticmethod
    def get_watch_history(current_user):
        user_id = str(current_user['_id'])
        limit = int(request.args.get('limit', 20))
        try:
            history = OTTService.get_watch_history(user_id, limit=limit)
            return success(history)
        except Exception as e:
            return error(str(e), 500)

    @staticmethod
    def save_watch_progress(current_user):
        user_id = str(current_user['_id'])
        data = request.get_json() or {}
        content_id = data.get('content_id', '').strip()
        progress   = float(data.get('progress_percent', 0))
        episode_id = data.get('episode_id')
        if not content_id:
            return error('content_id required')
        try:
            result = OTTService.save_watch_progress(user_id, content_id, progress, episode_id)
            return success(result)
        except Exception as e:
            return error(str(e), 500)

    # ── Recommendations ───────────────────────────────────────────────

    @staticmethod
    def get_recommendations(current_user):
        user_id = str(current_user['_id'])
        limit = int(request.args.get('limit', 20))
        try:
            items = OTTService.get_recommendations(user_id, limit=limit)
            return success(items)
        except Exception as e:
            return error(str(e), 500)

    # ── Admin / Seed ──────────────────────────────────────────────────

    @staticmethod
    def seed_content(current_user):
        try:
            result = OTTService.seed_demo_content()
            return success(result)
        except Exception as e:
            return error(str(e), 500)
