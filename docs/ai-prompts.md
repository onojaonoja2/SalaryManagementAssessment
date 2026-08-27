# AI Tooling & Prompts

This solution was built with AI assistance (this coding agent) while keeping
human judgment on architecture, scope and quality. Below are representative
prompts and how they were used. They are kept verbatim-ish to show the workflow.

## 1. Planning
> "analyze the assessment and come up with the plan as outlined in the
> documentation, tech stack is node, reactjs and typescript with a mysql
> database hosted on aiven. continue"

Produced the requirements/architecture/scope plan and a phased build list
(committed incrementally).

## 2. Tech-stack trade-offs
A clarifying question batch was used to lock: Express+Prisma, Tailwind+shadcn,
simple login, Render+Vercel — instead of guessing.

## 3. Backend scaffolding (example prompt)
> "Create an Express + TypeScript + Prisma service with JWT auth, employee CRUD,
> a salary history table, and report endpoints. Keep core aggregation as pure
> functions for testing."

Resulted in `lib/aggregate.ts` (pure, unit-tested) and service/route layers.

## 4. Seed generation
> "Write a deterministic seed for 10,000 employees across 15 countries with
> salary history, using a seeded PRNG so tests are reproducible."

Led to `prisma/seed.ts` with a mulberry32 PRNG.

## 5. Frontend
> "Build a React + Vite + TS app with Tailwind/shadcn: login, dashboard KPIs +
> charts, an employee table with filters/pagination, a detail page with salary
> history, and a reports page."

## How AI was used intentionally
- **Acceleration**: scaffolding, boilerplate components, and test skeletons.
- **Verification**: I ran `tsc --noEmit`, `vitest`, and a live smoke test rather
  than trusting generated code.
- **Corrections applied by human judgment**: fixed a transaction bug where
  `getEmployee` ran inside the Prisma `$transaction` (before commit) causing 404s;
  corrected raw-SQL column names; fixed relative import depths in the frontend.
