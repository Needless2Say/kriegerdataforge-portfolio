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

**How to work here:** read [`AGENTS.md`](AGENTS.md) (this repo's vision + critical rules) → [`WORKFLOW.md`](WORKFLOW.md) (the three-lane task loop) → [`skills.md`](skills.md) (the security playbook, before any security-sensitive work). Of those, `WORKFLOW.md`, `skills.md`, and `docs/agent/` are the agentic-workflow kit — centrally synced from `kriegerdataforge-cicd`; never edit the synced copies locally. `AGENTS.md` is **repo-owned**: it is maintained here and must be kept current with this repo.

---

## Tech Stack

| Layer      | Technology                                |
| ---------- | ----------------------------------------- |
| Framework  | Next.js 16.2 (App Router, static export)  |
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

`make ci` runs `ci-lint`, `ci-typecheck`, `ci-build`, and `ci-npm-audit` — the four
local gates. GitHub Actions CI runs those same four on every PR **plus** a secret-scan
(gitleaks) and a version-check (see [CI / release](#ci--release) below).

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

**Live URL:** the canonical URL is
<https://needless2say.github.io/kriegerdataforge-portfolio> — GitHub *project* pages,
no custom domain/CNAME. It is hardcoded as the metadata base in `src/app/layout.tsx`,
`src/app/robots.ts`, and `src/app/sitemap.ts`; keep all three in sync if it ever changes.

**Deployment status:** the first deploy is triggered manually (the workflow has no
automatic trigger) and has not happened yet — until the owner completes the
prerequisites above and dispatches it, the live URL 404s.

Bump the version in the PR that ships a change with **`make bump-patch`** (or
`make bump-minor` / `make bump-major`) — it updates `VERSION`, `package.json`, and
`package-lock.json` in lockstep (the version-check job requires `VERSION` and
`package.json` to match). The bump targets use a local Python venv (`make venv`,
auto-created on first bump).

---

## Security — read [`skills.md`](./skills.md)

This repo follows the KriegerDataForge ecosystem **security playbook** in [`skills.md`](./skills.md).
**Before any security-sensitive work** — dependencies/supply-chain, CI/CD or the GitHub Pages deploy
pipeline, secrets/env/config — open `skills.md` and follow the **scenario** that matches your task.

Non-negotiables for this **no-backend static site** (full detail + the scenario rules are in `skills.md`):

- **Nothing secret ever enters the bundle or the repo** — a static export ships every byte to the
  browser, and `NEXT_PUBLIC_*` env vars are **public by definition**, so no real secret may ever be
  an env value here. The only env values used (`NEXT_PUBLIC_EMAILJS_*`) are public-by-design IDs;
  real values still live only in gitignored `.env.local` / repo secrets, `.example` files hold
  placeholders, and CI's gitleaks scan covers full history.
- **Dependency / supply-chain hygiene** — `npm audit` (high+, prod deps) gates every PR; keep
  `package-lock.json` authoritative and review lockfile diffs; dependency bumps go through CI like
  any other change.
- **Deploy-pipeline integrity** — the Pages deploy is manual-dispatch behind a fail-closed
  deployer-authorization check and Environment reviewer approval; never weaken those gates, and
  keep the static-export/`basePath` build integrity intact.
- Found a security issue? **Verify it's real, then flag it** — and **pause for owner approval before any
  architectural, destructive, or behavior-changing edit**.
- The playbook's server-side rules — auth/OIDC/tokens, BFF/proxy/cookies, backend authz,
  server-authoritative recomputation — are **ecosystem-wide rules that do not apply to this
  no-backend static site**; see [`skills.md`](./skills.md) if a change ever grows such a surface.
