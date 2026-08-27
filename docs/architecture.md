# Architecture

## High-level diagram

```mermaid
flowchart LR
  HR[HR Manager] -->|HTTPS| WEB[React SPA\nVercel]
  WEB -->|/api (JWT)| API[Express API\nRender]
  API -->|Prisma| DB[(MySQL\nAiven)]
  SEED[Seed script\n10k employees] -->|populates| DB
```

## Components
- **API (`/server`)** — Express + TypeScript + Prisma.
  - Layered: routes → services → Prisma repository. Cross-cutting: zod
    validation, centralized error handler, JWT auth middleware.
  - Core aggregation logic lives in **pure functions** (`lib/aggregate.ts`)
    so it is unit-testable without a database.
- **Web (`/web`)** — React + Vite + TypeScript, Tailwind + shadcn-style
  components, TanStack Query for data fetching, Recharts for charts.
- **Database** — MySQL on Aiven. Schema: `Country`, `Department`, `Employee`,
  `Salary` (history). Migrations via Prisma.

## Data model
- `Country` — code, name, currency, `fxToUsd` (rate to convert local → USD).
- `Department` — name.
- `Employee` — master data; `countryId`, `departmentId`, self-ref `managerId`.
- `Salary` — `employeeId`, amount, currency, frequency, `effectiveFrom`,
  `effectiveTo` (null = current). History is preserved.

## Key flows
- **Login** → JWT returned → sent as `Bearer` on every `/api` call.
- **List/CRUD** → validated by zod; reports of invalid refs return 400/404.
- **Reports** → a single SQL query materializes current salaries joined to
  country FX; pure functions compute summaries, distributions and gaps.

## Why this shape
- Pure aggregation + SQL grouping keeps reports fast and the logic testable.
- Prisma gives type-safe models and reproducible migrations across local dev
  and Aiven prod from one schema.
