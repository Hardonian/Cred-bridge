# Production readiness status

This repository now has a deployable reference service path, but it is not yet approved for production credential issuance.

## Implemented in the current slice

- Strict TypeScript workspace and reproducible pnpm lockfile.
- Tenant-aware issuance API with role and request-context checks.
- Idempotent credit reservation/consume/release orchestration.
- Deterministic external issuer adapter boundary.
- Credential verification and JWKS discovery routes.
- Rate limiting, security headers, health endpoint, and privacy redaction helpers.
- CASE export primitive and synthetic bilingual reference data.

## Hard blockers before production

- Replace in-memory state with PostgreSQL and database-enforced transactions/constraints.
- Replace development header authentication with institutional OIDC/SAML and managed sessions.
- Replace the synthetic JWKS value with HSM/KMS-backed Ed25519 keys and rotation.
- Complete LTI 1.3 Advantage, simulation webhooks, CLR 2.0, LER-RS, revocation, and Accredible HTTP adapter.
- Add Playwright, axe, load, penetration, backup-restore, disaster-recovery, and concurrency test suites.
- Add production observability, incident response, DPA/privacy/legal review, and staged rollout controls.
