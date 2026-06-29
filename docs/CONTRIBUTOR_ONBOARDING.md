# Contributor Onboarding — kriegerdataforge-portfolio

Welcome. This is the **public face of KriegerDataForge (KDF)** — a Next.js static-export
marketing/portfolio site that showcases the platform's apps, stack, and the "forge /
data-blacksmith" brand. **No database, no auth, no backend** — pure presentation plus a
client-side contact form. Keep it simple; over-engineering a static site is the wrong instinct.

This guide gets you from zero to a running dev server, a green local CI, and your first PR.
For the *why* and the deeper rules, read [`AGENTS.md`](../AGENTS.md) first, then
[`WORKFLOW.md`](../WORKFLOW.md).

---

## 1. Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| **Node.js** | 20.x+ (LTS) | Runs Next.js 15.5; `@types/node` is pinned to `^20`. |
| **npm** | bundled with Node | The lockfile is `package-lock.json` (npm, not pnpm/yarn). |
| **Make** | any recent GNU Make | Drives the `make ci` / `make bump-*` targets. On Windows use Git Bash / WSL. |
| **Git** | any recent | — |
| **Python** | 3.13 *(optional)* | Only for `make bump-*` version bumps; a local `.venv` is auto-created on first bump. |
| **Docker** | *(optional)* | Only if you prefer the containerized dev server (`make docker-up`). |

You do **not** need Docker or Python for everyday UI work — Node + npm + Make is enough.

---

## 2. Clone & install

```bash
git clone https://github.com/Needless2Say/kriegerdataforge-portfolio.git
cd kriegerdataforge-portfolio

make setup      # checks Node, then runs `npm install`
# (equivalently: `make install` or plain `npm install`)
```

---

## 3. Environment / `.env.local` setup

The site runs **without any env vars** — the only configurable surface is the EmailJS contact
form. Without it, the form silently no-ops (fine for local UI work).

To wire the contact form locally, copy the example and fill in the three values:

```bash
cp .env.local.example .env.local
```

```bash
# .env.local  (gitignored — never commit real values)
NEXT_PUBLIC_EMAILJS_SERVICE_ID=...
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=...
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=...
```

These keys are **public-by-design** (they ship in the client bundle), but still treat
`.env.local` as gitignored and keep placeholders only in `.env.local.example`. The setup steps
to obtain each ID are documented inline in
[`.env.local.example`](../.env.local.example). For deploys, the same three are set as repo
secrets (`NEXT_PUBLIC_EMAILJS_*`).

---

## 4. Run it locally

```bash
make dev        # Next.js dev server with Turbopack (npx next dev --turbopack)
```

Open the app — note the `/kriegerdataforge-portfolio` base path is applied:

- Local dev: **http://localhost:3000/kriegerdataforge-portfolio**
- Docker dev: `make docker-up` → **http://localhost:3003/kriegerdataforge-portfolio**

To preview the **production static export** (what GitHub Pages serves):

```bash
make build          # static export → out/
make serve-static   # serves out/ at http://localhost:4174
```

---

## 5. Run the checks — `make ci`

Run the full local gate before every PR; it must be **green**:

```bash
make ci
```

`make ci` runs the same four gates GitHub Actions runs on every PR:

| Gate | Command | What it checks |
| --- | --- | --- |
| `ci-lint` | `npm run lint` | ESLint (`eslint-config-next`) |
| `ci-typecheck` | `npx tsc --noEmit` | TypeScript, strict, no `any` |
| `ci-build` | `npm run build` | The static export builds cleanly |
| `ci-npm-audit` | `npm audit --audit-level=high --omit=dev` | No high-sev CVEs in prod deps |

Individual targets exist too (`make lint`, `make typecheck`, `make check-all`). Run `make help`
for the full list.

> GitHub CI also runs **gitleaks** (full-history secret scan) and a **version-check** (`VERSION`
> must equal `package.json`'s version and be bumped). CodeQL is wired but gated behind
> `ENABLE_CODEQL`.

After CI is green, bump the version so the two files stay in lockstep:

```bash
make bump-patch     # or bump-minor / bump-major, chosen by impact
```

---

## 6. Where the code lives (module map)

| Path | Purpose |
| --- | --- |
| `src/app/` | App Router pages — `page.tsx` (home), `about/`, `projects/`, `contact/`, plus `layout.tsx`, `not-found.tsx`, `robots.ts`, `sitemap.ts` |
| `src/components/layout/` | Chrome — `Navbar`, `Footer`, `PageTransition` (barrel `index.ts`) |
| `src/components/ui/` | Presentational + effects — `ForgeCanvas`, `EmberField`, `ContactForm`, `Reveal`, `TypewriterText`, `Card`, `TechBadge`, etc. |
| `src/constants/` | **Content as data** — `kdf-info.ts`, `projects.ts`, `routes.ts`, `skills.ts`. Edit copy/links here, not in JSX. |
| `src/types/portfolio.ts` | Shared TS types (e.g. `Project`) |
| `src/utils/cn.ts` | `className` merge helper |
| `src/app/globals.css` | Tailwind layer + theme tokens (the amber/blue forge palette) |
| `next.config.ts` | Static-export + `basePath`/`assetPrefix` constraints |
| `scripts/bump_version.py` | Lockstep `VERSION` + `package.json` bumper (driven by `make bump-*`) |
| `.github/workflows/` | `ci.yml`, `codeql.yml` (gated), `nextjs.yml` (Pages deploy), `release.yml` |

**Required reading** before you change anything substantive (from [`AGENTS.md`](../AGENTS.md)):
`src/constants/kdf-info.ts` (brand statement), `src/constants/projects.ts` (the apps you're
showcasing), and `next.config.ts` (the constraints that govern every change).

---

## 7. Pick a lane and ship — the plan → approve → PR flow

Every task runs through [`WORKFLOW.md`](../WORKFLOW.md). In short:

1. **Pick a lane** — *Quick* (one-file, no-behavior), *Standard* (a one-repo feature/fix),
   or *Epic* (complex design or spans repos). When unsure, **size up**.
2. **Orient** — read [`AGENTS.md`](../AGENTS.md) (vision, rules, required reading); for
   security-relevant work read [`skills.md`](../skills.md) and follow the matching scenario.
3. **Plan → owner approves** — for anything behavior-/contract-/security-touching, share the
   plan and **wait for explicit owner approval** before implementing. A tiny in-pattern change
   needs only a 2–3 line plan.
4. **Implement** exactly the approved plan; match surrounding conventions; keep content in
   `src/constants/` and stay on theme.
5. **Verify** — `make ci` green, then `make bump-patch` (or minor/major). Stage files
   **explicitly** (never `git add -A`).
6. **PR** — feature branch off `main`, fill in
   [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md), confirm GitHub CI is
   green, then hand back. **The owner merges — never self-merge.**

Definition of Done scales with the change type — see
[`docs/agent/DEFINITION_OF_DONE.md`](agent/DEFINITION_OF_DONE.md).

---

## 8. Getting unblocked

- **Don't understand the purpose or how your task fits?** Stop and ask the owner — that's in
  the workflow, not a failure.
- **Lint/type errors?** `make typecheck` and `make lint` isolate them; remember **no `any`**.
- **Build fails on asset/link paths?** You probably broke a `basePath` assumption — check
  `next.config.ts` and that paths resolve under `/kriegerdataforge-portfolio`.
- **Contact form does nothing locally?** Expected without `.env.local` — see §3.
- **Version-check red in CI?** `VERSION` and `package.json` diverged — run `make bump-*`.
- **Security-sensitive change?** Read [`skills.md`](../skills.md) and follow the matching
  scenario; pause for owner approval before any behavior-changing edit.
- **Bigger design questions?** [`docs/agent/DESIGN_AND_EPICS.md`](agent/DESIGN_AND_EPICS.md) and
  [`docs/agent/AGENT_OPERATING_STANDARD.md`](agent/AGENT_OPERATING_STANDARD.md).
