# ── Subspace Backend — Production Dockerfile for Repository Root ──
FROM python:3.11-slim

# System dependencies for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (better layer caching)
COPY merged-app/backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code from the merged-app subdirectory
COPY merged-app/backend/ .

# Create upload directories
RUN mkdir -p uploads/profile_images uploads/invoices

# Render sets the PORT environment variable dynamically
ENV PORT=10000
EXPOSE 10000

# gunicorn + eventlet for Socket.IO support
CMD gunicorn \
    --worker-class eventlet \
    -w 1 \
    --bind 0.0.0.0:${PORT} \
    --timeout 120 \
    --keep-alive 5 \
    --log-level info \
    --access-logfile - \
    --error-logfile - \
    "wsgi:app"
