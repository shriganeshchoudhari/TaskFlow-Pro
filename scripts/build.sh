#!/usr/bin/env bash
set -euo pipefail

echo "Building backend..."
(cd backend && mvn -B -DskipTests package)

echo "Building frontend..."
(cd frontend && { [ -f package-lock.json ] && npm ci || npm install; } && npm run build)
