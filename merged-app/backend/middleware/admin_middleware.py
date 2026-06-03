from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from bson import ObjectId
from database.mongo import mongo

def admin_required(permission=None):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            try:
                verify_jwt_in_request()
                claims = get_jwt()
                if claims.get('type') != 'admin':
                    return jsonify({'success': False, 'message': 'Admin access required'}), 403
                admin_id = get_jwt_identity()
                admin = mongo.db.admins.find_one({'_id': ObjectId(admin_id), 'is_active': True})
                if not admin:
                    return jsonify({'success': False, 'message': 'Admin not found'}), 403
                if permission:
                    perms = admin.get('permissions', [])
                    # super_admin role always has all permissions
                    if admin.get('role') == 'super_admin':
                        pass  # allow all
                    elif 'all' not in perms and permission not in perms:
                        return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
            except Exception as e:
                return jsonify({'success': False, 'message': 'Unauthorized', 'error': str(e)}), 401
            return f(*args, **kwargs)
        return decorated
    return decorator
