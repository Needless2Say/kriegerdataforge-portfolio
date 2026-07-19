# Contributing to kriegerdataforge-portfolio

This is a private, owner-operated repository in the **KriegerDataForge (KDF)** ecosystem —
the company portfolio / marketing site. There are no external contributors; work here is done
by the owner and AI agents acting on the owner's behalf.

Before you start, read the canonical guides — they override anything summarized here:

- [`AGENTS.md`](./AGENTS.md) — vision & purpose, tech stack, module map, critical rules, required reading.
- [`WORKFLOW.md`](./WORKFLOW.md) — the Quick / Standard / Epic lanes and the plan → approve → PR loop.
- [`skills.md`](./skills.md) — the ecosystem security playbook (read before any security-sensitive work).
- [`docs/guides/CONTRIBUTOR_ONBOARDING.md`](docs/guides/CONTRIBUTOR_ONBOARDING.md) — a hands-on setup + run guide.

---

## Pick a lane (the workflow)

Every change follows [`WORKFLOW.md`](./WORKFLOW.md). Match the ceremony to the work:

- **Quick** — a typo, copy tweak, or one-file no-behavior fix → implement → `make ci` → version bump → PR.
- **Standard** — a one-repo feature or fix → orient → **plan & owner approves** → implement →
  `make ci` green (+ version bump) → PR → **GitHub CI green** → **owner merges**.
- **Epic** — complex/novel design or anything spanning more than one repo → the design gate +
  cross-repo coordination in [`docs/agent/DESIGN_AND_EPICS.md`](docs/agent/DESIGN_AND_EPICS.md).

**Don't skip the plan-approval gate, and never self-merge.** When unsure of the lane, size up.

---

## Code standards

This is a **static marketing site** — keep it simple and do not over-engineer (no DB, no auth,
no backend, no server runtime). The full rules live in [`AGENTS.md`](./AGENTS.md#critical-rules);
the ones you'll hit most:

**TypeScript / React**

- **No `any`.** Use proper types; `npx tsc --noEmit` must stay clean.
- **Named exports preferred** everywhere except Next.js `page.tsx` / `layout.tsx`, which use
  default exports per framework convention.
- Follow the existing patterns in `src/components/` and `src/app/`.

**Content & theme**

- **Content lives in `src/constants/`** (`kdf-info.ts`, `projects.ts`, `routes.ts`, `skills.ts`).
  Edit copy, project lists, and links there — not hard-coded in JSX.
- **Stay on theme** — background `#0a0704`, amber `#f59e0b` (forge fire), electric blue `#3b82f6`
  (data streams). Theme tokens are in `src/app/globals.css`.

**Static-export constraints**

- No server-only APIs or dynamic server rendering (`output: "export"`). Images are `unoptimized`.
- Asset and link paths must resolve under the `/kriegerdataforge-portfolio` `basePath`
  (`next.config.ts`); check `sitemap.ts` / `robots.ts` stay correct.

**Environment / secrets**

- Never hard-code secrets. EmailJS keys are public-by-design but still come from
  `NEXT_PUBLIC_EMAILJS_*` env — real values go in `.env.local` (gitignored);
  `.env.local.example` holds placeholders only. See [`skills.md`](./skills.md) before any
  security-sensitive change.

---

## Before opening a PR

Run the full local gate and make it **green** before you push:

```bash
make ci      # ci-lint + ci-typecheck (tsc --noEmit) + ci-build (static export) + ci-npm-audit
```

Then bump the version so `VERSION`, `package.json`, and `package-lock.json` stay in lockstep
(CI's version-check fails if `VERSION` and `package.json` diverge):

```bash
make bump-patch   # or bump-minor / bump-major, by impact
```

The full pre-PR checklist (no `any`, named exports, content in `src/constants/`, theme fidelity,
basePath-safe links, no committed secrets) is in
[`AGENTS.md`](./AGENTS.md#before-opening-a-pr-this-repo).

Open the PR against `main` using [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md),
say *what* changed and *how you verified it*, confirm **GitHub CI is green**, then hand back — the
**owner merges, never you**.

---

## Deployment

Deployment is **not** automatic on merge. The static export ships to GitHub Pages via
`.github/workflows/nextjs.yml` on **manual dispatch only**, behind a deployer-authorization check
and the `github-pages` Environment reviewer approval. See the README's
[Deploy section](./README.md#deploy-github-pages) for the gates.

---

## Security & conduct

- Report vulnerabilities privately per [`SECURITY.md`](./SECURITY.md) — never in a public issue.
- All participation is governed by the [`Code of Conduct`](./CODE_OF_CONDUCT.md).
