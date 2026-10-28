# Decisions

Technical choices worth explaining, newest last. Each entry records the context,
the decision, and what it costs — so a future reader (including me) can tell
whether a choice still holds.

---

## 1. pnpm workspaces for the monorepo

**Context.** API, web app and shared types in one repository.

**Decision.** pnpm workspaces, no Turborepo or Nx.

**Why.** pnpm links dependencies rather than copying them, and refuses imports a
package has not declared, so a dependency that works by accident fails loudly.
Turborepo solves build caching, which is not yet a problem at this size.

**Cost.** No task graph or remote caching. Revisit when builds get slow enough to
measure.

---

## 2. `.nvmrc` pinned to an exact patch version

**Decision.** `24.21.0`, not `24`.

**Why.** CI and Docker read this file. A floating major means local, CI and
production can run different builds without anyone noticing.

**Cost.** Must be edited by hand on every Node upgrade.

---

## 3. `moduleResolution: "bundler"`

**Decision.** `bundler` in the shared base config, for both apps.

**Why.** Vite is a bundler and `tsx` resolves extensionless imports, so both work
today, and imports stay free of the `.js`-extension-on-a-`.ts`-file awkwardness
that `nodenext` requires.

**Cost, deferred deliberately.** If the API is later compiled with `tsc` and run
under plain `node` in Docker, extensionless imports in the emitted JavaScript will
fail. Two ways out at that point: keep running `tsx` in the container, or switch
`apps/api` to `nodenext`.

---

## 4. Postgres published on host port 5433

**Context.** Another Postgres already listens on 5432 on the development machine.

**Decision.** Map `5433:5432`. The container still uses 5432 internally.

**Cost.** `DATABASE_URL` differs from the port most documentation assumes.

---

## 5. API on port 4000

**Context.** Port 3000 was occupied by an unrelated long-running dev server.

**Decision.** Default `PORT=4000`, and the Vite proxy targets it.

**Cost.** Also not the port most tutorials assume. It is configurable via `.env`.

---

## 6. TypeScript 6, not 7

**Context.** `pnpm add typescript` installed 7.0.2, the native compiler.
`typescript-eslint` 8 supports `>=4.8.4 <6.1.0` and **fails outright** on 7.0,
with the message "typescript-eslint does not support TS 7.0".

**Decision.** Pin the root to `typescript@^6`.

**Why.** Linting the whole repo is worth more than compile speed right now, and
6.0 is still current rather than a downgrade to 5.x.

**Cost.** No native-compiler performance. Revisit when typescript-eslint ships
TS 7 support — tracked at
https://github.com/typescript-eslint/typescript-eslint/issues/10940

---

## 7. Raw SQL with `pg` before an ORM

**Decision.** Hand-written SQL through `pg` first; Prisma or Drizzle considered
later.

**Why.** The SQL and the connection pooling are the parts worth understanding.
An ORM adopted before that is a black box.

**Cost.** More boilerplate, and migrations must be managed by hand at first.

---

## 8. `postgres:17-alpine`, with a reservation

**Decision.** The Alpine image, for size (415 MB against 663 MB).

**The reservation.** Alpine uses musl rather than glibc, and musl sorts text
differently. Managed Postgres (AWS RDS, the eventual target) is glibc-based, so
development and production can disagree on collation — which also affects indexes
on text columns.

**Open.** Switching to `postgres:17` would buy production parity for 250 MB.
Decide before any text index is created.

---

## 9. `container_name` pinned on the database

**Decision.** `container_name: teamworkspace-postgres` instead of Compose's
generated `teamworkspace-postgres-1`.

**Why.** Predictable name for `docker logs` and `docker exec`.

**Cost.** That service can never be scaled to multiple replicas. Acceptable for a
single database; it should not be set on stateless services later.

---

## 10. The Vite proxy instead of CORS

**Decision.** Vite forwards `/api` to the API in development. No CORS middleware.

**Why.** The browser only ever talks to the Vite origin, so requests are
same-origin and CORS never applies. Production will do the same thing at the
reverse proxy, so development and production match.

**Cost.** The API cannot be called directly from a browser on another origin —
intended.

---

## 11. `packages/shared` is consumed as TypeScript source

**Decision.** Entry points aim at `src/index.ts`; no build step, no `dist`.

**Why.** No build to run, no stale output, and a changed type is an immediate
compile error in both apps.

**Cost.** The package cannot be published to npm as-is. `"private": true`
enforces that.

---

## 12. No `packageManager` field

**Decision.** Leave it out; `engines` documents the requirement instead.

**Why.** That field is read by Corepack, whose stale shim previously caused a
"Cannot find matching keyid" failure on this machine. pnpm comes from Homebrew.

**Cost.** Nothing pins pnpm's version for collaborators. Add it deliberately if
that becomes a problem.

---

## 13. `/api/health` returns 200 even when degraded

**Decision.** Always 200; the body carries `status: "ok" | "degraded"`.

**Why.** The endpoint exists for the UI to display, and 200 lets it render
"database down" as information.

**Cost.** A load balancer reading only the status code would consider the service
healthy. A second endpoint returning 503 may be needed in production.

---

## 14. Commits are authored with a personal email

**Decision.** `user.email` is set per repository, not inherited from the global
config.

**Why.** This machine will eventually have a work Git identity. A repository-level
setting cannot be changed by a later global one.

**Cost.** The email is visible in public commit history. A GitHub `noreply`
address is the alternative, and changing it later means rewriting history.
