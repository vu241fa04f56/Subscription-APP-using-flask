// MongoDB init script — runs on first container start
db = db.getSiblingDB('subspace_db');

db.createCollection('users');
db.createCollection('admins');
db.createCollection('otps');
db.createCollection('subscription_plans');
db.createCollection('user_subscriptions');
db.createCollection('payments');
db.createCollection('notifications');
db.createCollection('chats');
db.createCollection('messages');
db.createCollection('refresh_tokens');
db.createCollection('activity_logs');

// Seed subscription plans
db.subscription_plans.insertMany([
  {
    name: 'Basic', slug: 'basic', price: 0, currency: 'INR',
    interval: 'monthly', is_free: true, is_active: true,
    features: ['5 matches/day', '20 messages/day', 'Basic profile'],
    limits: { matches_per_day: 5, chat_messages_per_day: 20, profile_views_per_day: 10, nearby_searches_per_day: 2 },
    trial_days: 0, sort_order: 0, created_at: new Date(), updated_at: new Date()
  },
  {
    name: 'Pro', slug: 'pro', price: 499, currency: 'INR',
    interval: 'monthly', is_free: false, is_active: true,
    features: ['50 matches/day', 'Unlimited messages', 'Priority profile', 'Nearby search', 'Analytics'],
    limits: { matches_per_day: 50, chat_messages_per_day: -1, profile_views_per_day: -1, nearby_searches_per_day: 20 },
    trial_days: 7, sort_order: 1, created_at: new Date(), updated_at: new Date()
  },
  {
    name: 'Elite', slug: 'elite', price: 999, currency: 'INR',
    interval: 'monthly', is_free: false, is_active: true,
    features: ['Unlimited matches', 'Unlimited everything', 'Verified badge', 'Priority support', 'Advanced analytics'],
    limits: { matches_per_day: -1, chat_messages_per_day: -1, profile_views_per_day: -1, nearby_searches_per_day: -1 },
    trial_days: 14, sort_order: 2, created_at: new Date(), updated_at: new Date()
  }
]);

print('Subspace DB initialized successfully.');
