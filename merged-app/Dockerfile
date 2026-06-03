# ── Subspace Backend — Production Dockerfile ──────────────────────────────────
# Place this file at the repo root so Render finds it automatically.
# Build context is the repo root; backend code lives in ./backend/

FROM python:3.11-slim

# System deps for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (better layer caching)
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ .

# Create upload directories (persistent volume should be mounted here on Render)
RUN mkdir -p uploads/profile_images uploads/invoices

# Render sets PORT env var; default to 10000 if not set
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
