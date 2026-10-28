# Team Workspace

A team collaboration app: workspaces, channels, real-time chat, threads, mentions,
reactions, file uploads, search and shared documents.

## Status

Early development. The foundation is in place — a pnpm monorepo, a typed API, a
React frontend and a Postgres database — and a health endpoint proves the three
talk to each other. Application features are not built yet.

| Area                                  | State          |
| ------------------------------------- | -------------- |
| Monorepo, TypeScript, lint, format    | ✅ working     |
| Postgres in Docker                    | ✅ working     |
| `GET /api/health` end to end          | ✅ working     |
| Auth, workspaces, channels, messaging | ⬜ not started |

## Stack

- **TypeScript** throughout, in a **pnpm** workspace monorepo
- **API** — Node + Express 5, ES modules, `tsx` for development
- **Web** — React 19 + Vite
- **Database** — PostgreSQL 17, run in Docker, queried with `pg` (raw SQL)
- **Validation** — Zod
- **Tooling** — ESLint (flat config) + Prettier

## Prerequisites

- **Node 24** — the exact version is pinned in `.nvmrc`; run `nvm use`
- **pnpm 10+**
- **Docker Desktop**, running

## Getting started

```bash
pnpm install
```

```bash
cp .env.example .env
```

```bash
pnpm db:up
```

Wait for the container to report `(healthy)`:

```bash
docker compose ps
```

```bash
pnpm dev
```

- Web — http://localhost:5173
- API — http://localhost:4000/api/health

The page shows the API's health response, including whether the database is
reachable. Stop Postgres with `pnpm db:down` and the page reports
`status: degraded`, `database: down` — the API stays up.

## Scripts

Run from the repository root.

| Script              | What it does                                 |
| ------------------- | -------------------------------------------- |
| `pnpm dev`          | Start the API and web app together           |
| `pnpm build`        | Production build of every package            |
| `pnpm typecheck`    | Type-check every package                     |
| `pnpm lint`         | ESLint across the repo                       |
| `pnpm lint:fix`     | ESLint with autofix                          |
| `pnpm format`       | Rewrite files with Prettier                  |
| `pnpm format:check` | Fail if anything is unformatted (used by CI) |
| `pnpm db:up`        | Start Postgres                               |
| `pnpm db:down`      | Stop Postgres (keeps data)                   |
| `pnpm db:logs`      | Follow the Postgres logs                     |

## Layout

```
apps/
  api/        Express server
  web/        React + Vite frontend
packages/
  shared/     Types shared by both, imported as source
```

`packages/shared` has no build step — the apps compile its TypeScript directly.
A change to a shared type is a compile error in every package that is out of date.

## Environment

Copy `.env.example` to `.env`. Both variables are validated by Zod when the API
starts; the process exits with a readable message if either is missing or invalid.

| Variable       | Purpose                                |
| -------------- | -------------------------------------- |
| `PORT`         | Port the API listens on (default 4000) |
| `DATABASE_URL` | Postgres connection string             |

## Ports

| Service    | Port | Note                                                              |
| ---------- | ---- | ----------------------------------------------------------------- |
| Web (Vite) | 5173 | Proxies `/api` to the API, so requests are same-origin            |
| API        | 4000 |                                                                   |
| Postgres   | 5433 | Published on 5433 to avoid clashing with a local Postgres on 5432 |

## Database

Postgres runs in Docker, with its data in a named volume that survives
`docker compose down`. To open a SQL prompt:

```bash
docker compose exec postgres psql -U workspace -d workspace
```

`docker compose down -v` deletes the volume and all data.

## Decisions

Notable technical choices and their reasoning are recorded in
[DECISIONS.md](./DECISIONS.md).
