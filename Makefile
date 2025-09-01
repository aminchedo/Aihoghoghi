# Iranian Legal Archive System - Makefile

.PHONY: help install test run clean docker setup

# Default target
help:
	@echo "🏛️ Iranian Legal Archive System v2.0"
	@echo "Available commands:"
	@echo "  make install    - Install dependencies and setup system"
	@echo "  make test      - Run system tests"
	@echo "  make run       - Start the application"
	@echo "  make dev       - Start in development mode"
	@echo "  make clean     - Clean cache and temporary files"
	@echo "  make docker    - Build and run with Docker"
	@echo "  make setup     - Full system setup"
	@echo "  make backup    - Create data backup"
	@echo "  make migrate   - Migrate from old version"

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	python3 setup.py

# Run tests
test:
	@echo "🧪 Running system tests..."
	python3 test_system.py

# Start application
run:
	@echo "🚀 Starting application..."
	python3 launch.py

# Development mode
dev:
	@echo "🔧 Starting in development mode..."
	uvicorn app:app --host 0.0.0.0 --port 8000 --reload

# Clean temporary files
clean:
	@echo "🧹 Cleaning temporary files..."
	rm -rf __pycache__/
	rm -rf utils/__pycache__/
	rm -rf .pytest_cache/
	rm -rf logs/*.log
	find . -name "*.pyc" -delete
	@echo "✅ Cleanup completed"

# Docker deployment
docker:
	@echo "🐳 Building and running with Docker..."
	docker-compose up -d --build
	@echo "✅ Docker deployment completed"
	@echo "🌐 Access at: http://localhost:8000"

# Full system setup
setup: install
	@echo "🏗️ Running full system setup..."
	python3 -c "from pathlib import Path; [Path(d).mkdir(parents=True, exist_ok=True) for d in ['data/databases', 'data/cache', 'data/models', 'logs']]"
	@echo "✅ System setup completed"

# Create data backup
backup:
	@echo "💾 Creating data backup..."
	tar -czf backup-$$(date +%Y%m%d-%H%M%S).tar.gz data/ logs/
	@echo "✅ Backup created"

# Migrate from old version
migrate:
	@echo "🔄 Migrating from old version..."
	python3 migrate_data.py
	@echo "✅ Migration completed"

# Install development dependencies
dev-install: install
	@echo "🛠️ Installing development dependencies..."
	pip install pytest black flake8 mypy
	@echo "✅ Development environment ready"

# Format code
format:
	@echo "🎨 Formatting code..."
	black *.py utils/*.py
	@echo "✅ Code formatted"

# Lint code
lint:
	@echo "🔍 Linting code..."
	flake8 *.py utils/*.py --max-line-length=120
	@echo "✅ Linting completed"

# Type check
typecheck:
	@echo "🔬 Type checking..."
	mypy *.py utils/*.py --ignore-missing-imports
	@echo "✅ Type checking completed"

# Run all quality checks
quality: format lint typecheck test
	@echo "✅ All quality checks passed"

# Production deployment
deploy: clean setup test
	@echo "🚀 Deploying to production..."
	uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
	@echo "✅ Production deployment completed"

# Database maintenance
db-maintenance:
	@echo "🗄️ Running database maintenance..."
	python3 -c "
	import sqlite3
	conn = sqlite3.connect('data/databases/legal_archive.sqlite')
	conn.execute('VACUUM')
	conn.execute('ANALYZE')
	conn.close()
	print('✅ Database maintenance completed')
	"

# Update proxy list
update-proxies:
	@echo "🔐 Updating proxy list..."
	curl -X POST "http://localhost:8000/api/update-proxies"
	@echo "✅ Proxy update initiated"

# Clear cache
clear-cache:
	@echo "⚡ Clearing cache..."
	curl -X DELETE "http://localhost:8000/api/cache"
	@echo "✅ Cache cleared"

# Show system status
status:
	@echo "📊 System status:"
	curl -s "http://localhost:8000/api/status" | python3 -m json.tool

# Show system stats
stats:
	@echo "📈 System statistics:"
	curl -s "http://localhost:8000/api/stats" | python3 -m json.tool