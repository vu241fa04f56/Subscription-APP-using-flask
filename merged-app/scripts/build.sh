#!/usr/bin/env bash
set -euo pipefail

echo "==> Building Subspace Platform Docker images..."
cd "$(dirname "$0")/.."

docker compose -f docker/docker-compose.yml build --no-cache
echo "==> Build complete."
