# Requirements Document — ACME Salary Management

## Goal
Provide the ACME HR Manager with a web application to manage salary data for
10,000 employees across multiple countries (currently maintained in error-prone
Excel sheets) and to answer "how does the org pay people" via self-serve
analytics.

## Persona
HR Manager — non-technical, needs a clean, searchable interface and trustworthy
numbers, not a database console.

## Scope (in)
- **Employee master data**: create / read / update / delete, with country,
  department, job title, manager, gender, dates.
- **Salary management**: record the current salary and its full **history**
  (changes over time keep an audit trail of effective dates).
- **Search & filter**: by name/email/code, country, department, gender and
  annual salary band (USD-normalized across currencies).
- **Analytics ("how we pay")**: headcount, total annual payroll, average &
  median salary, payroll by country, by department, salary distribution, and a
  gender pay gap view.
- **Auth**: a single HR-manager login (JWT) — enough to protect sensitive data.
- **Seed**: 10,000 employees with realistic, deterministic data.
- **Deployment**: live, with a video walkthrough.

## Deliberately out of scope (and why)
- **Full RBAC / multiple users** — one persona is described; a single shared
  login demonstrates access control without the scope of user management.
- **Real payroll runs, tax, payslips** — the problem is *data management + insight*,
  not transaction processing.
- **Benefits, time-off, performance** — separate domains; would dilute focus.
- **Live Excel import** — mitigated by a deterministic seed + CSV-style data
  model; import can be a follow-up once the schema is proven.
- **Audit logging / SSO** — valuable but not required for the demo; noted as a
  trade-off in `docs/trade-offs.md`.

## Key decisions
- Relational DB (MySQL/Aiven) chosen for reporting integrity and aggregations.
- Multi-currency handled by storing local salary + an FX rate per country, with
  all cross-country totals converted to USD for comparability.
- Salary kept as a history table so "current" pay is a query, not an overwrite.
