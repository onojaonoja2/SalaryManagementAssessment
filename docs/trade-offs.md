# Trade-offs & Decisions

| Decision | Choice | Alternative | Rationale / Trade-off |
|---|---|---|---|
| Backend framework | **Express + Prisma** | NestJS, Fastify | Express is lean and widely understood; Prisma gives migrations + type safety. NestJS adds DI/structure but more boilerplate for this scope. |
| UI library | **Tailwind + shadcn-style** | MUI, Ant Design | Full control, small bundle, modern look. Hand-rolled the few primitives we need instead of pulling Radix to keep deps minimal. |
| Auth | **Single JWT login** | No auth / Full RBAC | Sensitive HR data needs *some* gate; full RBAC was out of scope for one persona. Trade-off: shared credential, no per-user audit. |
| Multi-currency payroll | **Store local salary + `fxToUsd` per country** | Store everything in USD | Keeps source data realistic (a salary is agreed in local currency) while enabling comparable USD roll-ups. Trade-off: FX rates are static snapshots. |
| Salary history | **Separate `Salary` table** | Single `currentSalary` column | Preserves how pay evolved (the "how we pay" story) and avoids overwriting history. Slightly more query complexity. |
| Aggregation | **Pure TS functions over a SQL-derived fact set** | Pure SQL aggregates | Pure functions are unit-testable and readable; SQL does the heavy lifting of joining current salaries + FX. |
| Reports DB query | **One `$queryRaw` + in-memory reduce** | Fully in SQL | Simple, fast for 10k rows, and keeps the math in tested code. For much larger orgs we'd push more into SQL. |
| Test DB | **Dedicated `salary_mgmt_test`** | Reuse dev DB | Avoids clobbering seeded dev data; keeps integration tests deterministic. |
| Deployment | **Render (API) + Vercel (SPA)** | Single host / containers | Free tiers, minimal config, clear separation of API and static frontend. |

## Known limitations
- FX rates are fixed at seed time (no live rates).
- No audit log of *who* changed what.
- Salary-band filtering is USD-normalized; within a single currency it is exact,
  across currencies it is approximate (by design, to stay comparable).
- Aiven free tier / Render free tier sleep; first request may be slow.
