from datetime import datetime, timezone

class SubscriptionPlanModel:
    COLLECTION = 'subscription_plans'
    INTERVALS = ['monthly', 'quarterly', 'yearly']

    @staticmethod
    def default():
        now = datetime.now(timezone.utc)
        return {
            'is_active': True,
            'features': [],
            'limits': {
                'matches_per_day': 10,
                'chat_messages_per_day': 50,
                'profile_views_per_day': 20,
                'nearby_searches_per_day': 5,
            },
            'trial_days': 0,
            'sort_order': 0,
            'created_at': now,
            'updated_at': now,
        }

    SAMPLE_PLANS = [
        {
            'name': 'Basic',
            'slug': 'basic',
            'price': 0,
            'currency': 'INR',
            'interval': 'monthly',
            'features': ['5 matches/day', '20 messages/day', 'Basic profile'],
            'limits': {'matches_per_day': 5, 'chat_messages_per_day': 20, 'profile_views_per_day': 10, 'nearby_searches_per_day': 2},
            'is_free': True,
            'trial_days': 0,
        },
        {
            'name': 'Pro',
            'slug': 'pro',
            'price': 499,
            'currency': 'INR',
            'interval': 'monthly',
            'features': ['50 matches/day', 'Unlimited messages', 'Priority profile', 'Nearby search', 'Analytics'],
            'limits': {'matches_per_day': 50, 'chat_messages_per_day': -1, 'profile_views_per_day': -1, 'nearby_searches_per_day': 20},
            'is_free': False,
            'trial_days': 7,
        },
        {
            'name': 'Elite',
            'slug': 'elite',
            'price': 999,
            'currency': 'INR',
            'interval': 'monthly',
            'features': ['Unlimited matches', 'Unlimited everything', 'Verified badge', 'Priority support', 'Advanced analytics'],
            'limits': {'matches_per_day': -1, 'chat_messages_per_day': -1, 'profile_views_per_day': -1, 'nearby_searches_per_day': -1},
            'is_free': False,
            'trial_days': 14,
        },
    ]
