.PHONY: build up down restart logs seed backup shell-backend shell-mongo test

build:
	docker compose -f docker/docker-compose.yml build

up:
	docker compose -f docker/docker-compose.yml up -d

down:
	docker compose -f docker/docker-compose.yml down

restart:
	docker compose -f docker/docker-compose.yml restart

logs:
	docker compose -f docker/docker-compose.yml logs -f

seed:
	docker exec subspace_backend python database/seed_admin.py

backup:
	bash scripts/backup.sh

deploy:
	bash scripts/deploy.sh

shell-backend:
	docker exec -it subspace_backend bash

shell-mongo:
	docker exec -it subspace_mongo mongosh -u admin -p password --authenticationDatabase admin subspace_db

test:
	docker exec subspace_backend python -m pytest tests/ -v
