from geopy.distance import geodesic

def calculate_distance_km(lat1, lon1, lat2, lon2) -> float:
    return geodesic((lat1, lon1), (lat2, lon2)).kilometers

def build_geo_query(latitude, longitude, radius_km):
    if radius_km < 0:
        return {
            '$near': {
                '$geometry': {'type': 'Point', 'coordinates': [longitude, latitude]}
            }
        }
    return {
        '$near': {
            '$geometry': {'type': 'Point', 'coordinates': [longitude, latitude]},
            '$maxDistance': radius_km * 1000,
        }
    }

def coordinates_to_dict(latitude, longitude):
    return {
        'type': 'Point',
        'coordinates': [longitude, latitude]
    }
