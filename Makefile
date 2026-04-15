.PHONY: help up down build logs clean init

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

init: ## Initial setup — copy .env and build
	@test -f .env || cp .env.example .env
	@echo "Environment file ready."
	docker compose build

up: ## Start all services
	docker compose up --build

up-d: ## Start all services (detached)
	docker compose up --build -d

down: ## Stop all services
	docker compose down

build: ## Rebuild all containers
	docker compose build --no-cache

logs: ## Tail logs from all services
	docker compose logs -f

logs-service: ## Tail logs from a specific service (usage: make logs-service s=user-service)
	docker compose logs -f $(s)

clean: ## Remove all containers, volumes, and images
	docker compose down -v --rmi all --remove-orphans

status: ## Show status of all services
	docker compose ps

restart: ## Restart all services
	docker compose restart

test: ## Run tests
	@echo "Example: docker compose exec user-service npm test"
