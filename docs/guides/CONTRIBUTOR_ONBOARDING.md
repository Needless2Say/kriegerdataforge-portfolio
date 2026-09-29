# Contributor Onboarding, kriegerdataforge-portfolio

Welcome. This is the **public face of KriegerDataForge (KDF)**, a Next.js static export
portfolio site that shows the platform's apps, stack, and the "forge /
data blacksmith" brand. **No database, no auth, no backend**. Pure presentation plus a
client side contact form. Keep it simple. Over engineering a static site is the wrong instinct.

This guide gets you from zero to a running dev server, a green local CI, and your first PR.
For the *why* and the deeper rules, read [`AGENTS.md`](../../AGENTS.md) first, then
[`WORKFLOW.md`](../../WORKFLOW.md).

Unfamiliar term or acronym anywhere in these docs? The vocabulary is defined in
[`docs/reference/GLOSSARY.md`](../reference/GLOSSARY.md), which links to the ecosystem wide
canon glossary in the hub.

---

## 1. Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| **Node.js** | 24.x | Next.js 16.2 needs Node 20.9+, but the Pages deploy workflow and the Docker dev image both run Node 24. Match them rather than the floor. `@types/node` is pinned to `^26`. |
| **npm** | bundled with Node | The lockfile is `package-lock.json` (npm, not pnpm/yarn). |
| **Make** | any recent GNU Make | Drives the `make ci` / `make bump-*` targets. On Windows use Git Bash / WSL. |
| **Git** | any recent | — |
| **Python** | 3.14 *(optional)* | Only for `make bump-*` and the `make ci-style` kdf-fmt gate. A local `.venv` is auto created on first use. |
| **Docker** | *(optional)* | Only if you prefer the containerized dev server (`make docker-up`). |

You do **not** need Docker or Python for everyday UI work, Node + npm + Make is enough.

---

## 2. Clone & install

```bash
git clone https://github.com/Needless2Say/kriegerdataforge-portfolio.git
cd kriegerdataforge-portfolio

make setup      # checks Node, then runs `npm install`
# (equivalently: `make install` or plain `npm install`)
```

---

## 3. Environment / `.env.kdf` and `.env.local` setup

The site runs **without any env vars**. The only configurable surface is the EmailJS contact
form. Without it, the form silently no ops (fine for local UI work).

Local settings live in two gitignored files, the ecosystem's env standard (cicd ADR D-030).
`.env.kdf` holds every credential and no AI session reads it. `.env.local` holds only values
that work on this machine, and this site needs none. `make setup` creates both from their
examples, never overwriting. To wire the contact form, fill in the three values in `.env.kdf`:

```bash
# .env.kdf  (gitignored, never commit real values)
NEXT_PUBLIC_EMAILJS_SERVICE_ID=...
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=...
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=...
GH_PACKAGES_PAT=...        # only for make ci-style, see the file
```

These keys are **public by design** (they ship in the client bundle), but still treat
`.env.kdf` as gitignored and keep placeholders only in `.env.kdf.example`. The setup steps
to obtain each ID are documented inline in
[`.env.kdf.example`](../../.env.kdf.example). Next.js reads `.env.local` and never `.env.kdf`,
so the Makefile exports the keys for `make build` and compose hands `.env.kdf` to the dev
container. For deploys, the same three are set as repo secrets (`NEXT_PUBLIC_EMAILJS_*`).

---

## 4. Run it locally

**Hot reload development is Docker only. There is no `make dev`.**

```bash
make docker-up      # build + start, waits until healthy
make docker-logs    # follow the container logs
make docker-stop    # stop (container kept)
make docker-down    # stop AND remove
```

Open the app:

- **http://localhost:3003**

The container is the whole stack. No backend, no database, and it deliberately does not join
the shared `kdf-net`, because a standalone static site has no sibling service to call. There is
no `docker-up-full`.

`build` and `serve-static` below stay on the **host** on purpose, `out/` is what GitHub Pages
actually serves, so previewing the real export beats any dev server.

To preview the **production static export** (what GitHub Pages serves):

```bash
make build          # static export → out/
make serve-static   # serves out/ at http://localhost:4174
```

---

## 5. Run the checks. `make ci`

Run the full local gate before every PR. It must be **green**:

```bash
make ci
```

`make ci` runs five gates locally, GitHub Actions runs the same five on every PR, plus
secret-scan, version-check and CodeQL (which need PR context):

| Gate | Command | What it checks |
| --- | --- | --- |
| `ci-lint` | `npm run lint` | ESLint (`eslint .`, covers `src/` **and** the root config files) |
| `ci-style` | `kdf-fmt check` | The KDF Python house style over `scripts/` (ADR D-003) |
| `ci-typecheck` | `npx tsc --noEmit` | TypeScript, strict, no `any` |
| `ci-build` | `npm run build` | The static export builds cleanly |
| `ci-npm-audit` | `npm audit --audit-level=high --omit=dev` | No high sev CVEs in prod deps |

Individual targets exist too (`make lint`, `make typecheck`, `make check-all`). Run `make help`
for the full list.

> GitHub CI also runs **gitleaks** (full history secret scan) and a **version-check** (`VERSION`
> must equal `package.json`'s version and be bumped). CodeQL is wired but gated behind
> `ENABLE_CODEQL`.

After CI is green, bump the version so `VERSION`, `package.json`, and `package-lock.json`
stay in lockstep:

```bash
make bump-patch     # or bump-minor / bump-major, chosen by impact
```

---

## 6. Where the code lives (module map)

| Path | Purpose |
| --- | --- |
| `src/app/` | App Router pages. `page.tsx` (home), `about/`, `projects/`, `contact/`, plus `layout.tsx`, `not-found.tsx`, `robots.ts`, `sitemap.ts` |
| `src/components/layout/` | Chrome. `Navbar`, `Footer`, `PageTransition` (barrel `index.ts`) |
| `src/components/ui/` | Presentational + effects, `ForgeCanvas`, `EmberField`, `ContactForm`, `Reveal`, `TypewriterText`, `Card`, `TechBadge`, etc. |
| `src/constants/` | **Content as data.** `kdf-info.ts`, `projects.ts`, `routes.ts`, `skills.ts`. Edit copy/links here, not in JSX. |
| `src/types/portfolio.ts` | Shared TS types (e.g. `Project`) |
| `src/utils/cn.ts` | `className` merge helper |
| `src/app/globals.css` | Tailwind layer + theme tokens (the amber/blue forge palette) |
| `next.config.ts` | Static export + `basePath`/`assetPrefix` (sourced from `src/constants/routes.ts`, currently empty) |
| `scripts/bump_version.py` | Lockstep `VERSION` + `package.json` + `package-lock.json` bumper (driven by `make bump-*`) |
| `.github/workflows/` | `ci.yml`, `codeql.yml` (gated), `cd.yml` (Pages deploy), `release.yml` |

**Required reading** before you change anything substantive (from [`AGENTS.md`](../../AGENTS.md)):
`src/constants/kdf-info.ts` (brand statement), `src/constants/projects.ts` (the apps you're
showcasing), and `next.config.ts` (the constraints that govern every change).

---

## 7. Pick a lane and ship. The plan → approve → PR flow

Every task runs through [`WORKFLOW.md`](../../WORKFLOW.md). In short:

1. **Pick a lane.** *Quick* (one file, no behavior), *Standard* (a one repo feature/fix),
   or *Epic* (complex design or spans repos). When unsure, **size up**.
2. **Orient.** Read [`AGENTS.md`](../../AGENTS.md) (vision, rules, required reading), for
   security relevant work read [`skills.md`](../../skills.md) and follow the matching scenario.
3. **Plan → owner approves.** For anything behavior-/contract-/security-touching, share the
   plan and **wait for explicit owner approval** before implementing. A tiny in pattern change
   needs only a 2–3 line plan.
4. **Implement** exactly the approved plan. Match surrounding conventions. Keep content in
   `src/constants/` and stay on theme.
5. **Verify.** `make ci` green, then `make bump-patch` (or minor/major). Stage files
   **explicitly** (never `git add -A`).
6. **PR.** Feature branch off `main`, fill in
   [`.github/PULL_REQUEST_TEMPLATE.md`](../../.github/PULL_REQUEST_TEMPLATE.md), confirm GitHub CI is
   green, then hand back. **The owner merges. Never self-merge.**

Definition of Done scales with the change type. See
[`docs/agent/DEFINITION_OF_DONE.md`](../agent/DEFINITION_OF_DONE.md).

---

## 8. Getting unblocked

- **Don't understand the purpose or how your task fits?** Stop and ask the owner. That's in
  the workflow, not a failure.
- **Lint/type errors?** `make typecheck` and `make lint` isolate them, remember **no `any`**.
- **Build fails on asset/link paths?** You probably broke a `basePath` assumption. Check
  `next.config.ts` and `src/constants/routes.ts` (`BASE_PATH`, currently empty since the
  site deploys at the `kriegerdataforge.com` domain root).
- **Contact form does nothing locally?** Expected without the EmailJS keys in `.env.kdf`. See §3.
- **Version-check red in CI?** `VERSION` and `package.json` diverged. Run `make bump-*`.
- **Security sensitive change?** Read [`skills.md`](../../skills.md) and follow the matching
  scenario. Pause for owner approval before any behavior changing edit.
- **Bigger design questions?** [`docs/agent/DESIGN_AND_EPICS.md`](../agent/DESIGN_AND_EPICS.md) and
  [`docs/agent/AGENT_OPERATING_STANDARD.md`](../agent/AGENT_OPERATING_STANDARD.md).
