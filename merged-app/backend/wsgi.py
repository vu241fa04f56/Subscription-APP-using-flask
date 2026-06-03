import eventlet
eventlet.monkey_patch()

import os
from app import app, socketio  # noqa: F401

# gunicorn looks for the variable named 'app' in this module
# socketio.run() is NOT called here — gunicorn handles the server loop

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
