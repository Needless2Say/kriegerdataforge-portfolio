# kriegerdataforge-portfolio — Agent Guide

The KriegerDataForge company portfolio / marketing site: a **Next.js 15.5 static export**
(App Router · React 19 · TypeScript · TailwindCSS v4) deployed to **GitHub Pages**. No
database, no auth, no backend — content and components live under `src/`.

## Commands

| Task                 | Command         |
| -------------------- | --------------- |
| Dev server           | `npm run dev`   |
| Build (static export)| `npm run build` |
| Lint                 | `npm run lint`  |
| All CI gates (local) | `make ci`       |
| Bump version         | `make bump-patch` (or `bump-minor` / `bump-major`) — syncs `VERSION` + `package.json` |

## Security — read [`skills.md`](./skills.md)

This repo follows the KriegerDataForge ecosystem **security playbook** in [`skills.md`](./skills.md).
**Before any security-sensitive work** — auth/OIDC/tokens, BFF/proxy/CSP/cookies, backend authz/endpoints,
secrets/env/config, Terraform/infra, CI/CD, or dependencies — open `skills.md` and follow the **scenario**
that matches your task.

Non-negotiables (full detail + the scenario rules are in `skills.md`):

- **Fail closed, never open.** The **server is authoritative** — recompute security/$-relevant values
  (totals, prices, roles, status); never trust client-sent ones.
- **Never trust client input** for a security decision — IPs (use the edge header, not raw `X-Forwarded-For`),
  hostnames / `request.url` (the internal bind, not the browser host), `Origin`, ownership (exact check, not a
  substring/regex).
- **Secrets never touch git or logs** — real values only in gitignored files; `.example` holds placeholders;
  never echo a secret; the owner rotates.
- **Least privilege** — closed request schemas + field allow-lists (no blind `setattr`), distinct per-client
  OIDC audiences, validated `iss`/`aud`.
- Found a security issue? **Verify it's real, then flag it** — and **pause for owner approval before any
  architectural, destructive, or behavior-changing edit** (OIDC protocol changes get a design note first).
