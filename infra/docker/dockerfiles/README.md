# Dockerfiles

Two multi-stage production Dockerfiles. Both require **repo root** as the build context.

## Files

| File | Purpose | Base Image |
|------|---------|------------|
| `Dockerfile.backend` | Spring Boot 3.5 REST API | Eclipse Temurin 21 JRE Alpine |
| `Dockerfile.frontend` | React 18 SPA served by nginx | nginx:1.25-alpine |

## Build Commands

Always build from the **repo root** (not from this directory):

```bash
# Backend — multi-stage: Maven builder → JRE runtime
docker build -t taskflow-backend:latest \
  -f infra/docker/dockerfiles/Dockerfile.backend .

# Frontend — multi-stage: Node build → nginx serving dist/
docker build -t taskflow-frontend:latest \
  --build-arg VITE_API_URL=https://api.taskflowpro.com/api/v1 \
  -f infra/docker/dockerfiles/Dockerfile.frontend .
```

## Why Repo Root Context?

Both Dockerfiles `COPY` source from paths relative to the repo root:
- `COPY backend/pom.xml .` (Dockerfile.backend)
- `COPY frontend/package*.json ./` (Dockerfile.frontend)
- `COPY infra/docker/nginx.conf /etc/nginx/conf.d/taskflow.conf` (Dockerfile.frontend)

Running `docker build` from within `infra/docker/dockerfiles/` would fail because these paths
don't exist relative to that directory.

## Key Features

### Dockerfile.backend
- **Stage 1:** `eclipse-temurin:21-jdk-alpine` — Maven build + `jar extract` for layer caching
- **Stage 2:** `eclipse-temurin:21-jre-alpine` — minimal JRE, non-root `taskflow` user
- Spring layered JAR for optimal Docker layer caching
- `HEALTHCHECK` via `wget` on `/actuator/health`
- `JAVA_OPTS`: G1GC, container-aware memory (`-XX:UseContainerSupport`, `MaxRAMPercentage=75`)

### Dockerfile.frontend
- **Stage 1:** `node:20-alpine` — `npm ci` + `npm run build` → `dist/`
- **Stage 2:** `nginx:1.25-alpine` — serves `dist/`, custom nginx config for SPA
- nginx.conf provides: SPA fallback, API proxy, gzip compression, security headers, asset caching
- Non-root `nginx` user
- `HEALTHCHECK` via `wget` on port 80

## docker-compose Usage

The compose files in `../` reference these Dockerfiles with `context: ../..` (repo root):

```yaml
# infra/docker/docker-compose.dev.yml
build:
  context: ../..
  dockerfile: infra/docker/dockerfiles/Dockerfile.backend
```

See `../docker-compose.dev.yml` for the full local dev stack configuration.
