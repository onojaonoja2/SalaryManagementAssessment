# Security Model & Hardening

This documents the security posture of the Salary Management app and the
hardening applied in response to an OWASP Top 10:2025 review.

## Controls in place
- **Authentication**: single HR-manager login, password stored as a bcrypt hash.
  Tokens are signed JWTs with `aud`/`iss`/`jti` claims, a 30-minute TTL
  (`JWT_TTL`), and a server-side revocation denylist (invalidated on logout).
- **Transport secrets**: JWT secret must be set; the app **refuses to boot in
  production** if `JWT_SECRET` or `HR_PASSWORD` is missing.
- **Token storage**: the SPA stores the JWT in `sessionStorage` (not
  `localStorage`) and sends it as a `Bearer` header. A strict **CSP** (via
  Helmet on the API and headers on the static host) limits XSS blast radius.
- **Rate limiting**: strict limiter on `POST /api/auth/login` (10 / 10 min / IP)
  plus a global limiter; mitigates brute force / credential stuffing.
- **Access control**: all `/api` routes except `login`/`logout`/`health` require
  a valid token (incl. `/api/reference`).
- **Injection**: all SQL uses Prisma's parameterized `$queryRaw` tagged
  templates; no string-concatenated SQL. React escapes rendered output (no
  `dangerouslySetInnerHTML`) → no stored XSS.
- **Security logging**: login success/failure, logout, and all employee /
  salary mutations are logged as structured events **without** secrets or PII.
- **Error handling**: generic 500 messages; raw errors are redacted in logs
  (no SQL/values leaked to clients or logs).
- **Dependency hygiene**: `npm audit fix` applied; Dependabot configured for
  weekly updates of server, web and GitHub Actions.

## OWASP Top 10:2025 coverage
| # | Category | Status |
|---|----------|--------|
| A1 | Broken Access Control | Mitigated (auth on all mutating/read routes; object-level N/A for single admin) |
| A2 | Cryptographic Failures | Mitigated (no default secret in prod; bcrypt; TLS to Aiven via `ssl-mode=REQUIRED`) |
| A3 | Injection | Mitigated (parameterized queries; React auto-escaping) |
| A4 | Insecure Design | Mitigated (no on-screen credentials; rate limits; audit trail) |
| A5 | Security Misconfiguration | Mitigated (Helmet/CSP; secrets out of VCS; redacted logs) |
| A6 | Vulnerable & Outdated Components | Mitigated (audit fix + Dependabot) |
| A7 | Auth Failures | Mitigated (rate limit, HttpOnly-style short TTL + revocation, no on-screen pw) |
| A8 | Data Integrity Failures | Monitored (CI `npm audit`; supply-chain gate recommended) |
| A9 | Logging & Monitoring Failures | Mitigated (structured security events) |
| A10 | SSRF | N/A (no outbound requests) |

## Residual risks / future work
- **Single shared credential**: by design (one HR persona). For multi-user use,
  add per-user accounts, roles, MFA and password rotation.
- **Revocation denylist is in-memory**: resets on restart and is not shared
  across instances. Use a shared store (e.g. Redis) for multi-instance deploys.
- **Dev-only dependency advisories**: `web` has outstanding Vite/esbuild
  advisories that only affect the **dev server** and are absent from the
  production static build. Fixing requires a breaking Vite v8 upgrade; revisit
  when convenient.
- **PII at rest**: employee salary/demographic data is sensitive. Ensure the
  database (Aiven) is encrypted at rest and access is network-restricted.
- **HTTPS**: enforce TLS at the edge (Render/Vercel provide this by default);
  the API should only be reachable over HTTPS in production.
