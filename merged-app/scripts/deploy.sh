#!/usr/bin/env bash
set -euo pipefail

echo "==> Deploying Subspace Platform..."
cd "$(dirname "$0")/.."

docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml pull
docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d --remove-orphans
docker image prune -f

echo "==> Running DB seed..."
docker exec subspace_backend python database/seed_admin.py || true

echo "==> Deployment complete. Services:"
docker compose -f docker/docker-compose.yml ps
