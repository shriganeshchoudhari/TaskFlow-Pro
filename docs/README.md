# TaskFlow Pro Documentation

This directory contains the source-of-truth documentation for the TaskFlow Pro product and engineering standards.

## 📚 Product
- **[PRD.md](./PRD.md)** — Product Requirements, User Personas, Roadmap.
- **[UI/UX Guidelines](./UI_UX.md)** — (Proposed) Component usage and design system.

## 🛠 Engineering & Architecture
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** — Data model, relationships, and Flyway migration references.
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** — API standards, error handling, and authentication flows.
- **[SECURITY_COMPLIANCE.md](./SECURITY_COMPLIANCE.md)** — AuthN/AuthZ specs, GDPR, and security protocols.
- **[TTD.md](./TTD.md)** — Technical Task Design and System Architecture.

## 🚦 Operations
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — (Proposed) AWS EKS setup, Docker build, and release process.
- **[RUNBOOKS.md](./RUNBOOKS.md)** — (Proposed) Incident response and maintenance procedures.

---

## How to Update

1. **Architecture Changes:** If you change the DB schema or System Design, you must update the corresponding doc and create an ADR in `../.ai/adr/`.
2. **Review:** Documentation changes should be reviewed alongside code PRs.
3. **Diagrams:** Use Mermaid.js syntax for diagrams within these markdown files.