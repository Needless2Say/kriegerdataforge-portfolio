# KriegerDataForge — Portfolio

The KriegerDataForge company portfolio / marketing site. Showcases KDF's projects,
services, and tech stack with a forge / data-blacksmith theme (dark industrial,
amber + blue accents).

A Next.js **static export** deployed to **GitHub Pages** under
`/kriegerdataforge-portfolio`. No database, no auth, no backend.

---

## Documentation & the agentic workflow kit

All documentation lives under [`docs/`](docs/), indexed one line per doc at [**`docs/README.md`**](docs/README.md). Each subdirectory carries its own README explaining what belongs there and how to use it:

| Directory | Purpose |
| --- | --- |
| [`docs/agent/`](docs/agent/) | **The agentic-workflow kit** — the shared operating standard synced across every KDF repo (never edit locally) |
| [`docs/guides/`](docs/guides/README.md) | How-to and operational walkthroughs — currently contributor onboarding (zero → dev server → green `make ci` → first PR) |

**How to work here:** read [`AGENTS.md`](AGENTS.md) (this repo's vision + critical rules) → [`WORKFLOW.md`](WORKFLOW.md) (the three-lane task loop) → [`skills.md`](skills.md) (the security playbook, before any security-sensitive work). Those plus `docs/agent/` are the agentic-workflow kit — centrally synced from `kriegerdataforge-cicd`; never edit the synced copies locally.

---

## Tech Stack

| Layer      | Technology                                |
| ---------- | ----------------------------------------- |
| Framework  | Next.js 15.5 (App Router, static export)  |
| UI         | React 19                                  |
| Language   | TypeScript                                |
| Styling    | TailwindCSS v4                            |
| Deployment | GitHub Pages                              |

---

## Commands

| Task                 | Command         |
| -------------------- | --------------- |
| Dev server           | `npm run dev`   |
| Build                | `npm run build` |
| Lint                 | `npm run lint`  |
| All CI gates (local) | `make ci`       |

`make ci` runs `ci-lint`, `ci-typecheck`, `ci-build`, and `ci-npm-audit` — the same
checks the GitHub Actions CI runs on every PR.

---

## CI / release

CI runs on every PR to `main` (`.github/workflows/ci.yml`): lint + type-check,
static-export build, `npm audit`, **secret-scan** (gitleaks, full history), and a
**version-check** (VERSION must be bumped and equal `package.json`'s version). These
are the gate before anything ships.

- **CodeQL** (`.github/workflows/codeql.yml`) is wired but **gated** behind the
  `ENABLE_CODEQL` Actions variable — it stays skipped/green on a private repo until
  Code Security is entitled (set `ENABLE_CODEQL=true` to enable, no edit needed).
- **Releases** (`.github/workflows/release.yml`) auto-create a `v{VERSION}` GitHub
  Release when `VERSION` is merged to `main`.

### Deploy (GitHub Pages)

`.github/workflows/nextjs.yml` deploys the static export to GitHub Pages on **manual
dispatch only**, behind two gates: a fail-closed **deployer-authorization** check
(against `kriegerdataforge-cicd/scripts/deployer_registry.json`) and the
**`github-pages` Environment** reviewer approval. Before the first deploy the owner
must (1) add this repo to `deployer_registry.json`, (2) set the Environment's
required reviewers, and (3) add the `NEXT_PUBLIC_EMAILJS_*` repo secrets (else the
live contact form silently no-ops). See the PL-072 delivery checklist.

Bump the version in the PR that ships a change with **`make bump-patch`** (or
`make bump-minor` / `make bump-major`) — it updates `VERSION` and `package.json`
in lockstep (the version-check job requires they match). The bump targets use a
local Python venv (`make venv`, auto-created on first bump).

---

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
