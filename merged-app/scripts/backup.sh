#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

echo "==> Backing up MongoDB..."
docker exec subspace_mongo mongodump \
  --username admin \
  --password password \
  --authenticationDatabase admin \
  --db subspace_db \
  --out /tmp/dump_$TIMESTAMP

docker cp subspace_mongo:/tmp/dump_$TIMESTAMP "$BACKUP_DIR/mongo_$TIMESTAMP"
echo "==> MongoDB backup saved to $BACKUP_DIR/mongo_$TIMESTAMP"

echo "==> Backing up uploads..."
docker cp subspace_backend:/app/uploads "$BACKUP_DIR/uploads_$TIMESTAMP"
echo "==> Uploads saved to $BACKUP_DIR/uploads_$TIMESTAMP"

echo "==> Backup complete."
