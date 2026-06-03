import math
from bson import ObjectId
from database.mongo import mongo

def cosine_similarity(vec_a: list, vec_b: list) -> float:
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    mag_a = math.sqrt(sum(a ** 2 for a in vec_a))
    mag_b = math.sqrt(sum(b ** 2 for b in vec_b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)

def profile_to_vector(user: dict, all_tags: list) -> list:
    interests = set(user.get('interests', []))
    skills = set(user.get('skills', []))
    combined = interests | skills
    return [1 if tag in combined else 0 for tag in all_tags]

class MatchingService:

    @staticmethod
    def get_matches(user_id: str, limit: int = 10, radius_km: float = None) -> list:
        user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return []

        swiped_ids = [s['target_id'] for s in mongo.db.user_swipes.find({'user_id': ObjectId(user_id)}, {'target_id': 1})]

        all_users = list(mongo.db.users.find({
            '_id': {'$ne': ObjectId(user_id), '$nin': swiped_ids},
            'is_active': True,
        }, {'_id': 1, 'name': 1, 'avatar': 1, 'bio': 1, 'interests': 1, 'skills': 1, 'city': 1, 'country': 1, 'age': 1, 'photos': 1, 'location': 1}))

        if not all_users:
            return []

        user_loc = user.get('location')
        user_coords = user_loc.get('coordinates') if (user_loc and isinstance(user_loc, dict) and 'coordinates' in user_loc) else None

        all_tags = list(set(
            tag
            for u in [user] + all_users
            for tag in (u.get('interests', []) + u.get('skills', []))
        ))

        user_vec = profile_to_vector(user, all_tags)
        scored = []
        for candidate in all_users:
            cand_loc = candidate.get('location')
            cand_coords = cand_loc.get('coordinates') if (cand_loc and isinstance(cand_loc, dict) and 'coordinates' in cand_loc) else None
            
            distance_km = None
            if user_coords and cand_coords:
                try:
                    from utils.geo_helper import calculate_distance_km
                    # coordinates: [longitude, latitude]
                    distance_km = calculate_distance_km(user_coords[1], user_coords[0], cand_coords[1], cand_coords[0])
                except Exception:
                    pass

            # Filter by radius if provided and not global (-1)
            if radius_km is not None and radius_km >= 0:
                if distance_km is None or distance_km > radius_km:
                    continue

            cand_vec = profile_to_vector(candidate, all_tags)
            score = cosine_similarity(user_vec, cand_vec)
            common = (set(user.get('interests', [])) | set(user.get('skills', []))) & \
                     (set(candidate.get('interests', [])) | set(candidate.get('skills', [])))
            scored.append({
                'user_id': str(candidate['_id']),
                'name': candidate.get('name', ''),
                'avatar': candidate.get('avatar', ''),
                'bio': candidate.get('bio', ''),
                'city': candidate.get('city', ''),
                'country': candidate.get('country', ''),
                'age': candidate.get('age'),
                'photos': candidate.get('photos', []),
                'score': round(score * 100, 1),
                'common_interests': list(common)[:5],
                'distance_km': round(distance_km, 1) if distance_km is not None else None,
            })

        scored.sort(key=lambda x: x['score'], reverse=True)
        return scored[:limit]

    @staticmethod
    def get_nearby_users(user_id: str, latitude: float, longitude: float, radius_km: float = 50) -> list:
        from utils.geo_helper import build_geo_query
        geo_query = build_geo_query(latitude, longitude, radius_km)
        users = list(mongo.db.users.find({
            '_id': {'$ne': ObjectId(user_id)},
            'location': geo_query,
            'is_active': True,
        }, {'_id': 1, 'name': 1, 'avatar': 1, 'bio': 1, 'city': 1, 'interests': 1, 'location': 1}))

        return [
            {
                'user_id': str(u['_id']),
                'name': u.get('name', ''),
                'avatar': u.get('avatar', ''),
                'bio': u.get('bio', ''),
                'city': u.get('city', ''),
                'interests': u.get('interests', []),
                'location': u.get('location'),
            }
            for u in users
        ]
