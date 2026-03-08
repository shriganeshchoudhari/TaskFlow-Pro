# Definition of Done (DoD)

A change is “done” when:

- Requirements are clear (acceptance criteria present in `docs/PRD.md` or the PR description)
- API/DB/UI changes are documented (update relevant files in `docs/`)
- Security considerations are addressed (authz, validation, secrets) and checked against `docs/SECURITY_COMPLIANCE.md`
- Tests exist for the change (unit/integration/e2e as appropriate)
- Quality gates pass (see `./QUALITY_GATES.md`)
- No new high/critical issues are introduced (build warnings, failing CI, broken local run)

