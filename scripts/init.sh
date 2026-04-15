#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Initializing ChatApp Microservice..."
echo "==========================================="

if [ ! -f "$PROJECT_DIR/.env" ]; then
  cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
  echo "✅ Created .env from .env.example"
else
  echo "ℹ️  .env already exists, skipping"
fi

if command -v docker &> /dev/null; then
  echo "✅ Docker found: $(docker --version)"
else
  echo "❌ Docker not found. Please install Docker Desktop."
  exit 1
fi

if docker compose version &> /dev/null; then
  echo "✅ Docker Compose found: $(docker compose version --short)"
else
  echo "❌ Docker Compose not found."
  exit 1
fi

echo ""
echo "📦 Building containers..."
cd "$PROJECT_DIR"
docker compose build

echo ""
echo "==========================================="
echo "✅ Project initialized successfully!"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your configuration"
echo "  2. Run: docker compose up --build"
echo "  3. Open: http://localhost:8080"
echo "==========================================="