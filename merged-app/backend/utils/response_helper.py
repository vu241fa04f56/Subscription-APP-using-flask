from flask import jsonify

def success_response(message: str, data=None, status_code: int = 200):
    response = {'success': True, 'message': message}
    if data is not None:
        response['data'] = data
    return jsonify(response), status_code

def error_response(message: str, errors=None, status_code: int = 400):
    response = {'success': False, 'message': message}
    if errors:
        response['errors'] = errors
    return jsonify(response), status_code

def paginated_response(message: str, data: list, total: int, page: int, per_page: int):
    return jsonify({
        'success': True,
        'message': message,
        'data': data,
        'pagination': {
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page,
        }
    }), 200
