# KriegerDataForge — Portfolio

The KriegerDataForge company portfolio / marketing site. Showcases KDF's projects,
services, and tech stack with a forge / data-blacksmith theme (dark industrial,
amber + blue accents).

A Next.js **static export** deployed to **GitHub Pages** under
`/kriegerdataforge-portfolio`. No database, no auth, no backend.

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
