from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import logging

logger = logging.getLogger(__name__)
_scheduler = None

def expire_subscriptions_job(app):
    with app.app_context():
        from services.subscription_service import SubscriptionService
        SubscriptionService.expire_subscriptions()
        logger.info('Subscription expiry job ran')

def send_renewal_reminders_job(app):
    with app.app_context():
        from database.mongo import mongo
        from services.email_service import EmailService
        from datetime import datetime, timezone, timedelta
        from bson import ObjectId

        reminder_days = [7, 3, 1]
        now = datetime.now(timezone.utc)
        for days in reminder_days:
            target = now + timedelta(days=days)
            start = target.replace(hour=0, minute=0, second=0, microsecond=0)
            end = target.replace(hour=23, minute=59, second=59)
            subs = list(mongo.db.user_subscriptions.find({
                'status': 'active',
                'expires_at': {'$gte': start, '$lte': end},
                'auto_renew': True,
            }))
            for sub in subs:
                user = mongo.db.users.find_one({'_id': sub['user_id']})
                plan = mongo.db.subscription_plans.find_one({'_id': sub['plan_id']})
                if user and user.get('email') and plan:
                    EmailService.send_renewal_reminder(
                        user['email'], user.get('name', ''), days, plan.get('name', '')
                    )

def start_scheduler(app):
    global _scheduler
    if _scheduler and _scheduler.running:
        return
    _scheduler = BackgroundScheduler()
    _scheduler.add_job(
        func=expire_subscriptions_job,
        args=[app],
        trigger=CronTrigger(hour=0, minute=5),
        id='expire_subscriptions',
        replace_existing=True,
    )
    _scheduler.add_job(
        func=send_renewal_reminders_job,
        args=[app],
        trigger=CronTrigger(hour=9, minute=0),
        id='renewal_reminders',
        replace_existing=True,
    )
    _scheduler.start()
    logger.info('Scheduler started')
