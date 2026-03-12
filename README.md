# TaskFlow Pro 🚀

> Enterprise-grade Collaborative Task Management Platform

[![CI/CD](https://github.com/your-org/taskflow-pro/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/shriganeshchoudhari/TaskFlow-Pro/actions)
[![Coverage](https://codecov.io/gh/your-org/taskflow-pro/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/taskflow-pro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Overview

TaskFlow Pro is an enterprise-ready collaborative task management platform built with Java 21 + Spring Boot backend and React + Vite frontend, deployed on Kubernetes (AWS EKS).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 21, Spring Boot 3.x, Spring Security, JWT |
| Database | PostgreSQL 16, JPA/Hibernate, Flyway |
| Frontend | React 18, Vite 5, Redux Toolkit, Material UI v5 |
| DevOps | Docker, Kubernetes (EKS), Helm 3, Terraform |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus, Grafana |
| Testing | JUnit 5, Postman/Newman, Playwright |

## Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/taskflow-pro.git
cd taskflow-pro

# Start full stack with Docker Compose
docker-compose -f docker/docker-compose.dev.yml up --build

# Access the application
# Frontend: http://localhost:80
# Backend API: http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui.html
# Grafana: http://localhost:3000 (with --profile monitoring)
```

## Project Structure

```
taskflow-pro/
├── backend/                # Spring Boot REST API (Java 21)
├── frontend/               # React SPA (Vite + Redux + MUI)
├── docker/                 # Dockerfiles + docker-compose
├── k8s/                    # Kubernetes manifests (Kustomize)
├── helm/                   # Helm charts
├── terraform/              # AWS infrastructure (EKS, RDS, VPC)
├── monitoring/             # Prometheus + Grafana configs
├── tests/
│   ├── api/postman/        # Postman collections
│   ├── api/rest-client/    # REST Client (.http) files
│   └── e2e/playwright/     # Playwright E2E tests
└── docs/                   # All project documentation
```

## Documentation

| Document | Description |
|----------|-------------|
| [PRD.md](docs/PRD.md) | Product Requirements Document |
| [TTD.md](docs/TTD.md) | Technical Design Document |
| [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Database schema & ER diagram |
| [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | REST API reference |
| [UI_UX_SPECIFICATION.md](docs/UI_UX_SPECIFICATION.md) | UI/UX specs & user flows |
| [SECURITY_COMPLIANCE.md](docs/SECURITY_COMPLIANCE.md) | Security & GDPR compliance |
| [TEST_PLAN.md](docs/TEST_PLAN.md) | Testing strategy & coverage |
| [TEST_CASES_API.md](docs/TEST_CASES_API.md) | API test cases (Postman) |
| [TEST_CASES_E2E.md](docs/TEST_CASES_E2E.md) | E2E test cases (Playwright) |
| [DEPLOYMENT_OPERATION_MANUAL.md](docs/DEPLOYMENT_OPERATION_MANUAL.md) | Deployment & ops guide |

## Development

```bash
# Backend
cd backend
./mvnw spring-boot:run     # Start API on :8080
./mvnw test                # Run unit tests
./mvnw verify              # Run all tests + coverage

# Frontend
cd frontend
npm install && npm run dev  # Start dev server on :5173
npm test                    # Run Vitest
npm run build               # Production build

# E2E Tests
cd tests/e2e/playwright
npm install && npx playwright install
npx playwright test         # Run all E2E scenarios
npx playwright test --ui    # Interactive UI mode
```

## Deployment

```bash
# Deploy to Kubernetes with Helm
helm upgrade --install taskflow-pro ./helm/taskflow-pro \
  --namespace taskflow-pro --create-namespace \
  --set backend.image.tag=1.0.0 \
  --set frontend.image.tag=1.0.0 \
  --atomic

# Infrastructure with Terraform
cd terraform/environments/prod
terraform init && terraform plan && terraform apply
```

## License

MIT License — see [LICENSE](LICENSE) for details.
