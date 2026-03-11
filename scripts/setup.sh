#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# 1. Verify prerequisites
command -v docker  &>/dev/null || error "Docker not found. Install Docker Desktop."
command -v java    &>/dev/null || warn  "Java not found (needed for backend dev, not for Docker)."
command -v node    &>/dev/null || warn  "Node not found (needed for frontend dev, not for Docker)."

# 2. Check Docker daemon
docker info &>/dev/null || error "Docker daemon is not running. Start Docker Desktop."

# 3. Create .env if missing
if [[ ! -f .env ]]; then
  info "Creating .env from .env.example ..."
  cp .env.example .env 2>/dev/null || cat > .env <<'EOF'
JWT_SECRET=changeme-replace-with-64-char-base64-string-in-production
DB_PASSWORD=taskflow_dev_password
CORS_ALLOWED_ORIGINS=http://localhost:5173
EOF
fi

# 4. Pull images + build
info "Building and starting full local stack ..."
docker compose -f infra/docker/docker-compose.dev.yml pull --ignore-buildable
docker compose -f infra/docker/docker-compose.dev.yml up --build -d

# 5. Wait for backend health
info "Waiting for backend to become healthy ..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:8080/actuator/health | grep -q '"UP"'; then
    info "Backend is UP."
    break
  fi
  sleep 5
  [[ $i -eq 30 ]] && error "Backend did not become healthy after 150s."
done

# 6. Seed demo data (idempotent)
info "Seeding demo data ..."
curl -sf -X POST http://localhost:8080/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Demo User","email":"demo@taskflow.com","password":"DemoPass123!"}' \
  >/dev/null 2>&1 || true  # ignore duplicate-email error

info ""
info "✅ TaskFlow Pro is running!"
info "   Frontend:   http://localhost:80"
info "   Backend:    http://localhost:8080"
info "   Swagger:    http://localhost:8080/swagger-ui.html"
info "   Prometheus: http://localhost:9090  (docker compose --profile monitoring up)"
info "   Grafana:    http://localhost:3000  (docker compose --profile monitoring up)"
info ""
info "Demo credentials: demo@taskflow.com / DemoPass123!"
