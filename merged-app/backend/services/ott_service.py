"""
OTT Content Service — Subspace Platform
Handles content library, watchlist, watch history, and recommendations.
"""
from datetime import datetime
from bson import ObjectId
from database.mongo import get_db


class OTTService:

    # ── Content Library ──────────────────────────────────────────────

    @staticmethod
    def get_all_content(genre: str = None, content_type: str = None, limit: int = 100, skip: int = 0):
        db = get_db()
        query = {}
        if genre:
            query['genre'] = {'$regex': genre, '$options': 'i'}
        if content_type:
            query['type'] = content_type

        items = list(
            db.ott_content.find(query)
            .sort([('is_trending', -1), ('rating', -1)])
            .skip(skip)
            .limit(limit)
        )
        for item in items:
            item['_id'] = str(item['_id'])
        return items

    @staticmethod
    def get_content_by_id(content_id: str):
        db = get_db()
        try:
            item = db.ott_content.find_one({'_id': ObjectId(content_id)})
            if item:
                item['_id'] = str(item['_id'])
            return item
        except Exception:
            return None

    @staticmethod
    def search_content(query: str, limit: int = 20):
        db = get_db()
        results = list(db.ott_content.find(
            {'$text': {'$search': query}},
            {'score': {'$meta': 'textScore'}}
        ).sort([('score', {'$meta': 'textScore'})]).limit(limit))
        for item in results:
            item['_id'] = str(item['_id'])
        return results

    @staticmethod
    def get_trending(limit: int = 20):
        db = get_db()
        items = list(db.ott_content.find({'is_trending': True}).sort('rating', -1).limit(limit))
        for item in items:
            item['_id'] = str(item['_id'])
        return items

    @staticmethod
    def get_new_releases(limit: int = 20):
        db = get_db()
        items = list(db.ott_content.find({'is_new': True}).sort('created_at', -1).limit(limit))
        for item in items:
            item['_id'] = str(item['_id'])
        return items

    # ── Watchlist ─────────────────────────────────────────────────────

    @staticmethod
    def get_watchlist(user_id: str):
        db = get_db()
        entries = list(db.ott_watchlist.find({'user_id': user_id}).sort('added_at', -1))
        content_ids = [ObjectId(e['content_id']) for e in entries if ObjectId.is_valid(e['content_id'])]
        if not content_ids:
            return []
        items = {str(i['_id']): i for i in db.ott_content.find({'_id': {'$in': content_ids}})}
        result = []
        for entry in entries:
            item = items.get(entry['content_id'])
            if item:
                item['_id'] = str(item['_id'])
                item['added_at'] = entry.get('added_at')
                result.append(item)
        return result

    @staticmethod
    def add_to_watchlist(user_id: str, content_id: str):
        db = get_db()
        existing = db.ott_watchlist.find_one({'user_id': user_id, 'content_id': content_id})
        if existing:
            return {'already_exists': True}
        db.ott_watchlist.insert_one({
            'user_id': user_id,
            'content_id': content_id,
            'added_at': datetime.utcnow()
        })
        return {'added': True}

    @staticmethod
    def remove_from_watchlist(user_id: str, content_id: str):
        db = get_db()
        result = db.ott_watchlist.delete_one({'user_id': user_id, 'content_id': content_id})
        return {'deleted': result.deleted_count > 0}

    @staticmethod
    def is_in_watchlist(user_id: str, content_id: str) -> bool:
        db = get_db()
        return db.ott_watchlist.find_one({'user_id': user_id, 'content_id': content_id}) is not None

    # ── Watch History & Progress ──────────────────────────────────────

    @staticmethod
    def save_watch_progress(user_id: str, content_id: str, progress_percent: float,
                             episode_id: str = None):
        db = get_db()
        doc = {
            'user_id': user_id,
            'content_id': content_id,
            'episode_id': episode_id,
            'progress_percent': max(0, min(100, progress_percent)),
            'watched_at': datetime.utcnow()
        }
        db.ott_watch_history.update_one(
            {'user_id': user_id, 'content_id': content_id},
            {'$set': doc},
            upsert=True
        )
        return doc

    @staticmethod
    def get_watch_history(user_id: str, limit: int = 20):
        db = get_db()
        history = list(
            db.ott_watch_history.find({'user_id': user_id, 'progress_percent': {'$gt': 0}})
            .sort('watched_at', -1)
            .limit(limit)
        )
        # Enrich with content details
        content_ids = [ObjectId(h['content_id']) for h in history if ObjectId.is_valid(h['content_id'])]
        if not content_ids:
            return []
        items = {str(i['_id']): i for i in db.ott_content.find({'_id': {'$in': content_ids}})}
        result = []
        for h in history:
            if h['progress_percent'] >= 95:  # Completed — skip from continue watching
                continue
            item = items.get(h['content_id'])
            if item:
                item['_id'] = str(item['_id'])
                item['watch_progress'] = h['progress_percent']
                result.append(item)
        return result

    # ── Recommendations ───────────────────────────────────────────────

    @staticmethod
    def get_recommendations(user_id: str, limit: int = 20):
        """
        Simple genre-affinity recommendations.
        Looks at watch history to infer preferred genres, then surfaces
        unseen content in those genres with high ratings.
        """
        db = get_db()
        # Genres the user has watched
        history_ids = [
            h['content_id'] for h in
            db.ott_watch_history.find({'user_id': user_id}, {'content_id': 1})
        ]
        watched_set = set(history_ids)

        if history_ids:
            watched_content = list(db.ott_content.find(
                {'_id': {'$in': [ObjectId(i) for i in history_ids if ObjectId.is_valid(i)]}}
            ))
            from collections import Counter
            genre_counts = Counter(c.get('genre', '') for c in watched_content)
            preferred = [g for g, _ in genre_counts.most_common(3)]
        else:
            preferred = []

        # Surface content from preferred genres not yet watched
        query = {'_id': {'$nin': [ObjectId(i) for i in watched_set if ObjectId.is_valid(i)]}}
        if preferred:
            query['genre'] = {'$in': preferred}

        items = list(db.ott_content.find(query).sort('rating', -1).limit(limit))
        for item in items:
            item['_id'] = str(item['_id'])
        return items

    # ── Admin: seed content ───────────────────────────────────────────

    @staticmethod
    def seed_demo_content():
        """Insert demo content if collection is empty."""
        db = get_db()
        if db.ott_content.count_documents({}) > 0:
            return {'skipped': True}

        now = datetime.utcnow()
        demo = [
            {
                'title': 'Stellar Drift', 'type': 'series', 'genre': 'Sci-Fi',
                'year': 2024, 'rating': 9.1, 'seasons_count': 3,
                'is_trending': True, 'is_new': True,
                'description': 'A crew of astronauts discovers a mysterious signal at the edge of the solar system.',
                'cast': ['Maya Chen', 'Arjun Sharma', 'Elena Voss'],
                'accent_color': 'rgba(59,130,246,0.4)',
                'episodes': [
                    {'title': 'Pilot', 'duration': '52m', 'description': 'The crew receives an unidentified transmission.'},
                    {'title': 'The Signal', 'duration': '48m', 'description': 'Decoding the message reveals coordinates.'},
                    {'title': 'First Contact', 'duration': '55m', 'description': 'They arrive at the source.'},
                ],
                'created_at': now
            },
            {
                'title': 'Crimson Verdict', 'type': 'movie', 'genre': 'Thriller',
                'year': 2024, 'rating': 8.7, 'duration': '2h 14m',
                'is_trending': True, 'is_new': False,
                'description': 'A defense attorney must choose between saving her client and exposing a corrupt system.',
                'cast': ['Priya Mehta', 'Samuel Ford', 'Lena Kovic'],
                'accent_color': 'rgba(239,68,68,0.35)',
                'created_at': now
            },
            {
                'title': 'Seoul Bloom', 'type': 'series', 'genre': 'Romance',
                'year': 2024, 'rating': 8.9, 'seasons_count': 2,
                'is_trending': True, 'is_new': True,
                'description': 'Two rival chefs fall in love while competing for the same prestigious award.',
                'cast': ['Ji-won Park', 'Hyun-soo Lee'],
                'accent_color': 'rgba(236,72,153,0.35)',
                'episodes': [
                    {'title': 'Kitchen Wars', 'duration': '46m', 'description': 'Rivals meet.'},
                    {'title': 'Secret Ingredient', 'duration': '44m', 'description': 'Unexpected collaboration.'},
                ],
                'created_at': now
            },
            {
                'title': 'The Last Algorithm', 'type': 'series', 'genre': 'Thriller',
                'year': 2023, 'rating': 9.3, 'seasons_count': 1,
                'is_trending': True, 'is_new': False,
                'description': 'When a rogue AI predicts crimes, a detective faces impossible ethical choices.',
                'cast': ['Rajan Nair', 'Sofia Alves', 'Ben Thorpe'],
                'accent_color': 'rgba(108,71,255,0.4)',
                'episodes': [
                    {'title': 'Prediction Zero', 'duration': '58m', 'description': 'The AI makes its first prediction.'},
                    {'title': 'False Positive', 'duration': '51m', 'description': 'A prediction goes wrong.'},
                ],
                'created_at': now
            },
            {
                'title': 'Parallel Hearts', 'type': 'series', 'genre': 'Drama',
                'year': 2024, 'rating': 8.6, 'seasons_count': 2,
                'is_trending': False, 'is_new': True,
                'description': 'Two timelines trace the ripple effects of a single decision across three generations.',
                'cast': ['Deepa Reddy', 'Suresh Kumar'],
                'accent_color': 'rgba(16,185,129,0.3)',
                'episodes': [
                    {'title': '1987', 'duration': '52m', 'description': 'The original choice.'},
                    {'title': '2024', 'duration': '49m', 'description': 'The consequences.'},
                ],
                'created_at': now
            },
            {
                'title': 'Neon Labyrinth', 'type': 'movie', 'genre': 'Sci-Fi',
                'year': 2023, 'rating': 8.3, 'duration': '1h 52m',
                'is_trending': False, 'is_new': False,
                'description': 'In a city where memories can be extracted and sold, a thief discovers stolen memories.',
                'cast': ['Lyla Storm', 'Chen Wei'],
                'accent_color': 'rgba(168,85,247,0.35)',
                'created_at': now
            },
        ]
        result = db.ott_content.insert_many(demo)
        # Create text index for search
        db.ott_content.create_index([('title', 'text'), ('description', 'text'), ('cast', 'text')])
        return {'inserted': len(result.inserted_ids)}
