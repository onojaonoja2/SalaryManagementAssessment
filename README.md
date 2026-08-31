# ACME Salary Management

Employee salary management software for an organization with **10,000
employees across multiple countries**. Built for the HR Manager persona so they
can move off Excel and answer *"how does the org pay people?"* via self-serve
analytics.

- **Backend:** Node + Express + TypeScript + Prisma, MySQL on Railway
- **Frontend:** React + Vite + TypeScript + Tailwind (shadcn-style), TanStack Query, Recharts
- **Tests:** Vitest (unit) + Supertest (integration)

## Demo

Watch the application walkthrough: [Loom Video](https://www.loom.com/share/f6bd4b28d7c440869a58ab1ccd7a1b17)

## Repository layout
```
server/   Express + Prisma API
web/      React SPA
docs/     requirements, architecture, trade-offs, AI prompts, performance, planning notes
          
```

## Prerequisites
- Node.js 18+
- A MySQL database (local dev, or a hosted instance)
- `DATABASE_URL` pointing at your MySQL

## Local setup

### 1. Database
Create two schemas (dev + test), e.g. with MySQL CLI:
```sql
CREATE DATABASE salary_mgmt_dev CHARACTER SET utf8mb4;
CREATE DATABASE salary_mgmt_test CHARACTER SET utf8mb4;
```

### 2. Backend (`/server`)
```bash
cd server
cp .env.example .env          # edit DATABASE_URL / secrets
npm install
npx prisma migrate dev        # create tables
npm run seed                  # insert 10,000 employees
npm run dev                   # http://localhost:4000
```
Run tests:
```bash
npm test                      # unit + integration (uses salary_mgmt_test)
```

### 3. Frontend (`/web`)
```bash
cd web
cp .env.example .env          # VITE_API_URL can be empty in dev (Vite proxies /api)
npm install
npm run dev                   # http://localhost:5173
```
In development the Vite dev server proxies `/api` to the backend on
`http://localhost:4000`.

### Accounts (self-service)
There is **no shared password**. Open the app, go to the login page and click
**Sign up** to create your own HR account (email + password). After signing
in you can change your password anytime from the header **Change password**
button. `JWT_SECRET` is the only required server secret.

## Scripts
| Command | Description |
|---|---|
| `server: npm run dev` | Run API in dev |
| `server: npm run seed` | Seed 10k employees |
| `server: npm test` | Unit + integration tests |
| `server: npm run typecheck` | Type-check |
| `web: npm run dev` | Run frontend in dev |
| `web: npm run build` | Production build |

## Notes
See [`docs/`](docs/) for the requirements document, architecture diagram,
trade-off analysis, AI-tooling notes, performance considerations and planning
notes.
