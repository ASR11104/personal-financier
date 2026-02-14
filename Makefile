.PHONY: help up down logs clean

help:
	@echo "Available commands:"
	@echo "  make up              - Start all services (postgres, redis, backend, frontend)"
	@echo "  make down            - Stop all services (frontend, backend, db)"
	@echo "  make logs            - Show logs for database services"
	@echo "  make clean           - Stop services and remove volumes"

# Start all services
up:
	docker-compose -f backend/docker-compose.yml up -d && \
	echo "Waiting for PostgreSQL to be ready..." && \
	sleep 5 && \
	(cd backend && npm run dev) & \
	(cd frontend && npm run dev)

# Stop all services
down:
	-pkill -f "vite" || true
	-pkill -f "ts-node-dev" || true
	cd backend && docker-compose down

# Show database logs
logs:
	cd backend && docker-compose logs -f

# Clean up (stop and remove volumes)
clean:
	-pkill -f "vite" || true
	-pkill -f "ts-node-dev" || true
	cd backend && docker-compose down 
