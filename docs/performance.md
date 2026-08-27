# Performance Considerations

## Data volume
Designed for **10,000 employees** (and validated against a live 10k seed).

## Database
- Indexes on `employees(country_id)`, `employees(department_id)`, and
  `salaries(employee_id, effective_to)` — the latter makes "current salary"
  lookups (where `effective_to IS NULL`) efficient.
- The report endpoint uses **one joined query** to materialize current salaries
  plus country FX, then aggregates in the app. For 10k rows this is sub-second.
- Employee listing uses `WHERE` + pagination (`skip/take`) so only one page
  (25 rows) is returned; count is a separate cheap query.

## Application
- Aggregation is O(n) in memory over the current-salary fact set; at 10k rows
  this is trivial. For 1M+ employees we would push `SUM`/`GROUP BY` into SQL.
- Frontend fetches reports once (TanStack Query) and lets the user drill in;
  employee lists are paginated and cached.

## Frontend bundle
- Vite production build; Recharts is the largest dependency (~budget noted).
  Could be code-split per route later if bundle size matters.

## Seeding
- `createMany` in batches of 1k–2k to keep inserts fast; deterministic PRNG so
  the dataset is reproducible for tests and demos.
- Seeding the dev DB took a few seconds; Aiven a little longer over the network.

## Deployment
- Render free tier may spin down when idle (cold start). Health check at
  `/health` supports platform monitoring.
- Aiven MySQL free tier is sufficient for this read/write volume.
