# kriegerdataforge-portfolio — Agent Guide

> **This is the canonical agent guide for this repo.** `CLAUDE.md`, `.cursorrules`, and
> `.github/copilot-instructions.md` all point here. Read this first, then follow
> [`WORKFLOW.md`](./WORKFLOW.md) for every task and [`skills.md`](./skills.md) for
> security-sensitive work.

## Vision & purpose — what you're building toward

This is the **public face of KriegerDataForge (KDF)** — the company portfolio / marketing site that
tells the world what the platform is and invites people to build on it. KDF is Arthur Krieger's
personal software platform: a shared FastAPI + PostgreSQL backbone (the `kriegerdataforge` hub is its
auth/identity service) powering full-stack apps across fitness, gaming, and data-engineering domains,
with the ambition of becoming a large **data platform ecosystem that others build on**. This repo's job
is to make that vision legible and credible: it showcases the live apps (KDF Core API, Calorie Tracker,
Video Game DB, Analytics Pipeline), the tech stack, and the "forge / data-blacksmith" brand —
*forging raw data into powerful products* — through a dark industrial aesthetic (amber forge-fire +
electric-blue data-stream accents).

Concretely it is a **Next.js static export, no database, no auth, no backend** — pure presentation and a
contact form. It serves the ecosystem as the storefront and recruiting/credibility surface: everything
here exists to communicate the platform's quality and direction, so polish, performance, and brand
fidelity matter more than feature depth. Keep it simple — over-engineering a static marketing site is
the wrong instinct.

## Tech stack

- **Framework:** Next.js 15.5 — App Router, `output: "export"` static export (no server runtime)
- **UI:** React 19
- **Language:** TypeScript (strict; no `any`)
- **Styling:** TailwindCSS v4 (+ PostCSS)
- **Contact form:** EmailJS (`@emailjs/browser`) — client-side send, `NEXT_PUBLIC_EMAILJS_*` env
- **Deploy:** GitHub Pages under `/kriegerdataforge-portfolio` (`basePath` + `assetPrefix` set)
- **Tooling:** ESLint 9 (`eslint-config-next`), `tsc --noEmit`, Docker (dev), Make, a tiny Python venv for version bumps only

## Module map

| Path                          | Purpose                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- |
| `src/app/`                    | App Router pages — `page.tsx` (home), `about/`, `projects/`, `contact/`, plus `layout.tsx`, `not-found.tsx`, `robots.ts`, `sitemap.ts` |
| `src/components/layout/`      | Chrome — `Navbar`, `Footer`, `PageTransition` (barrel `index.ts`)        |
| `src/components/ui/`          | Presentational + effects — `ForgeCanvas`, `EmberField`, `ContactForm`, `Reveal`, `TypewriterText`, `Card`, `TechBadge`, etc. (barrel `index.ts`) |
| `src/constants/`             | Content as data — `kdf-info.ts`, `projects.ts`, `routes.ts`, `skills.ts` (edit content here, not in JSX) |
| `src/types/portfolio.ts`     | Shared TS types (e.g. `Project`)                                          |
| `src/utils/cn.ts`            | `className` merge helper                                                  |
| `src/app/globals.css`        | Tailwind layer + theme tokens                                            |
| `scripts/bump_version.py`    | Lockstep `VERSION` + `package.json` version bumper (driven by `make bump-*`) |
| `.github/workflows/`         | `ci.yml`, `codeql.yml` (gated), `nextjs.yml` (Pages deploy), `release.yml` |

## Critical rules

1. **Keep it simple** — this is a static marketing site; do not over-engineer. No DB, no auth, no backend, no server runtime.
2. **No `any`** — use proper TypeScript types; `tsc --noEmit` must stay clean.
3. **Named exports preferred** — default exports only for Next.js `page.tsx` / `layout.tsx` (and where a framework demands it).
4. **Content lives in `src/constants/`** — edit copy, project lists, and links there, not hard-coded in components.
5. **Honor the static-export constraints** — no server-only APIs, no dynamic server rendering; `images.unoptimized`, and asset paths must respect the `/kriegerdataforge-portfolio` `basePath`.
6. **Stay on theme** — background `#0a0704`, amber `#f59e0b` (forge fire), electric blue `#3b82f6` (data streams), amber↔blue animated gradient text.
7. **`VERSION` and `package.json` version must match** — bump via the Make targets only; CI fails if they diverge.
8. **EmailJS keys are public-by-design** but still come from `NEXT_PUBLIC_EMAILJS_*` secrets/env — never hard-code real IDs; `.env.local` is gitignored, `.env.local.example` holds placeholders.

## Commands

| Task            | Command                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| Dev server      | `npm run dev` (or `make dev` — Turbopack)                               |
| Build (export)  | `npm run build` (or `make build` → `out/`)                             |
| Preview build   | `make serve-static` (serves `out/` on :4174)                           |
| Lint            | `npm run lint` (or `make lint`)                                        |
| Type-check      | `make typecheck` (`tsc --noEmit`)                                      |
| Full CI (local) | `make ci` — runs `ci-lint`, `ci-typecheck`, `ci-build`, `ci-npm-audit` |
| Version bump    | `make bump-patch` (or `make bump-minor` / `make bump-major`)          |
| Docker dev      | `make docker-up` → http://localhost:3003/kriegerdataforge-portfolio   |

## Required reading

1. [`README.md`](./README.md) — what this site is, tech stack, CI/release, and the GitHub Pages deploy gates (PL-072).
2. [`src/constants/kdf-info.ts`](src/constants/kdf-info.ts) — the canonical KDF brand statement: tagline, mission, founder, and the ecosystem framing this site exists to communicate.
3. [`src/constants/projects.ts`](src/constants/projects.ts) — the live KDF apps and the platform story (FastAPI/PostgreSQL backbone) you're showcasing.
4. [`next.config.ts`](./next.config.ts) — static-export + `basePath`/`assetPrefix` constraints that govern every change.
5. [`skills.md`](./skills.md) — the ecosystem security playbook (read before any security-sensitive work).

Quick lookups: theme tokens → `src/app/globals.css`; content/copy → `src/constants/`; shared types → `src/types/portfolio.ts`; contact-form wiring → `src/components/ui/ContactForm.tsx` + `.env.local.example`.

## How to work in this repo — the agent kit

**Every task follows the tiered loop in [`WORKFLOW.md`](./WORKFLOW.md)** — pick a lane:

- **Quick** — tiny, no-behavior change → implement → `make ci` → PR.
- **Standard** — a one-repo feature → orient → **plan & owner approves** → implement → `make ci`
  green (+ version bump) → PR → **GitHub CI green** → **owner merges**.
- **Epic** — complex/novel design or anything that **spans repos** → the design gate + cross-repo
  coordination below.

Don't skip the plan-approval gate; don't self-merge. The supporting kit:

- [`docs/agent/DESIGN_AND_EPICS.md`](docs/agent/DESIGN_AND_EPICS.md) — the **design gate** (design
  doc + ADR, owner-approved before code) and the **cross-repo epic playbook** (blast-radius,
  contract-first ordering, flag-gated slices). **Cross-repo epic trackers live in the ecosystem hub
  at `kriegerdataforge/docs/epics/`.**
- [`docs/agent/DEFINITION_OF_DONE.md`](docs/agent/DEFINITION_OF_DONE.md) — the change-type-scaled
  **Definition of Done** (checkbox form in
  [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md)).
- [`docs/agent/templates/`](docs/agent/templates/) — copy-paste **design-spec**, **ADR**, and
  **epic-tracker** templates. ADRs land in `docs/CHANGELOG_AND_DECISION_LOG.md` (create if absent).

### Before opening a PR (this repo)

- [ ] `make ci` is green locally — `ci-lint`, `ci-typecheck` (`tsc --noEmit`), `ci-build` (static export), and `ci-npm-audit` all pass.
- [ ] No `any` types; named exports used (except `page.tsx` / `layout.tsx`); content changes live in `src/constants/`.
- [ ] Build respects the static-export + `basePath` constraints (asset paths resolve under `/kriegerdataforge-portfolio`); links/sitemap still correct.
- [ ] Theme fidelity preserved (amber/blue accents, forge aesthetic).
- [ ] Version bumped with `make bump-patch` (or `minor`/`major`) so `VERSION` == `package.json` version (the CI version-check requires this).
- [ ] No secrets committed — real `NEXT_PUBLIC_EMAILJS_*` values stay in gitignored `.env.local` / repo secrets, never in code; gitleaks scans full history.
- [ ] Anything architectural (build pipeline, deploy, framework upgrade) gets an ADR / design note first.

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
