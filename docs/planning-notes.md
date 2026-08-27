# Planning & Design Notes

## Approach
1. Read the assessment PDF and extracted the explicit deliverables: a
   requirements doc, end-to-end functional software, a 10k seed, tests,
   incremental commits, artifacts, a deployment and a video demo.
2. Decided scope explicitly (see `requirements.md`) so the build stayed focused.
3. Built backend first (it defines the API contract the UI depends on), proved
   it with unit + integration tests against a dedicated test DB, then built the
   UI against that contract.

## API contract (the contract the frontend was built against)
- `POST /api/auth/login` → `{ token, user }`
- `GET  /api/reference` → `{ countries, departments }`
- `GET  /api/employees?page&pageSize&search&countryId&departmentId&gender&minUsd&maxUsd&sort&order`
- `GET  /api/employees/:id` → employee + salary history
- `POST /api/employees` → create (with initial salary)
- `PUT  /api/employees/:id` → update master data
- `DELETE /api/employees/:id`
- `POST /api/employees/:id/salaries` → record a salary change (closes previous)
- `GET  /api/reports` → summary, byCountry, byDepartment, distribution,
  genderGap, genderGapSummary

## Milestones (mirrored in git commits)
- Backend: schema, services, routes, auth, seed, tests.
- Frontend: scaffold, UI primitives, login, dashboard, employees, detail,
  reports.
- Deploy + docs.

## Risks caught during build
- `getEmployee` was called inside the Prisma transaction (before commit) → 404;
  moved it outside the transaction.
- Raw SQL used `c.currency_code` but the column is `currencyCode` (no `@map`) →
  fixed to the real column name.
- Frontend relative import depths were off by one directory → fixed.
- Verified Prisma connects to Aiven with the provided `?ssl-mode=REQUIRED` URL
  before writing deploy config.
