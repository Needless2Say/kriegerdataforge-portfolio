# kriegerdataforge-portfolio, Agent Guide

> **This is the canonical agent guide for this repo.** `CLAUDE.md`, `.cursorrules`, and
> `.github/copilot-instructions.md` all point here. Read this first, then follow
> [`WORKFLOW.md`](./WORKFLOW.md) for every task and [`skills.md`](./skills.md) for
> security sensitive work. Unfamiliar KDF term, acronym, or ID prefix? Resolve it in
> [`docs/reference/GLOSSARY.md`](docs/reference/GLOSSARY.md) before acting on it.

## Vision & purpose. What you're building toward

This is the **public site for KriegerDataForge (KDF)**, a closed personal software platform Arthur
Krieger designs and builds on his own time, running only his own apps. It explains what the platform is, what is being built on it, and
what it is built with. An OAuth 2.0 / OIDC identity provider (the `kriegerdataforge` hub), a shared
Python SDK every app backend installs, a Terraform control plane, and the apps on top of them, across
18 repositories. The aesthetic is dark industrial, amber forge fire with purple/blue bit accents.

**Copy rule, and it is not negotiable.** This site is one person's personal project, built on his
own time. A site that reads like a business he runs on the side creates a problem that no amount of
polish is worth. The single most important thing this site says is that **the platform is closed**. Concretely:

- **Always describe the platform as closed.** It is a closed platform for Arthur himself and it runs
  all of his own personal apps. Every place the platform is described has to leave no room to read it
  as a product, a service, or something open to others. `KDF_INFO.access` is the short form of this
- **Do not add disclaimers.** The owner removed "nothing for sale", "nothing to sign up for",
  "no users but me", and "nobody else has an account". Saying the platform is closed is enough,
  listing what it is not protests too much. Do not put them back
- **No location.** No city, no state, no "based in", no `chi-town`. The platform is not based
  anywhere and the site must not imply it is
- **"Founder" is allowed**, and is the owner's explicit decision. It is a title on a closed personal
  platform, which is why the closed framing above has to carry its weight
- Never "we", "our", "the team", "services", "clients", "inquiries", or a brand-only copyright line
- **Say "on my own time".** Never "outside of work", "side project", "day job", "in parallel with",
  or any other phrasing that positions the platform against something else. On this site there is no
  something else
- Never reference a job, a role held anywhere, an organisation, a team, or anyone else's internal
  tooling. This site talks about the platform and nothing outside it. How Arthur spends his days
  belongs on the personal portfolio, not here
- **The stated motive is a passion made real.** One ecosystem where he can build any app he wants,
  every part of it following the same organized system, so everything stays simple to manage and
  maintain and works together seamlessly instead of taking piles of manual work. `KDF_INFO.why` is
  the canonical wording of it, do not invent a second one
- Never claim something is live, in production, or serving users unless it actually is. Statuses come
  from `ProjectStatus` and mean exactly what they say
- First person singular throughout. "I build", "my own apps", "my inbox"
- Prose in commas and periods. Avoid em dashes, colons, and semicolons unless they are necessary

Concretely it is a **Next.js static export, no database, no auth, no backend**. Pure presentation and a
contact form. Polish, performance, and honesty in the copy matter more than feature depth. Keep it
simple. Over engineering a static site is the wrong instinct.

## Tech stack

- **Framework.** Next.js 16.2 (`^16.2.9`). App Router, `output: "export"` static export (no server runtime)
- **UI.** React 19
- **Language.** TypeScript (strict, no `any`)
- **Styling.** TailwindCSS v4 (+ PostCSS)
- **Contact form.** EmailJS (`@emailjs/browser`). Client side send, `NEXT_PUBLIC_EMAILJS_*` env
- **Deploy.** GitHub Pages under `/kriegerdataforge-portfolio` (`basePath` + `assetPrefix` set)
- **Tooling.** ESLint 9 (`eslint-config-next`), `tsc --noEmit`, Docker (dev), Make, a tiny Python venv for version bumps only

## Module map

| Path                          | Purpose                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- |
| `src/app/`                    | App Router pages. `page.tsx` (home), `about/`, `projects/`, `contact/`, plus `layout.tsx`, `not-found.tsx`, `robots.ts`, `sitemap.ts` |
| `src/components/layout/`      | Chrome. `Navbar`, `Footer`, `PageTransition` (barrel `index.ts`)        |
| `src/components/ui/`          | Presentational + effects. `ForgeFire` (the full screen loader fire), `EmberField` (background), `StruckWordmark`, `ForgedHeading`, `BinaryStat`, `PourTimeline`, `HeatTracker`, `EmailModal` + `BurnAway`, `ContactForm` + `Transmission`, `Reveal`, `Card`, `TechBadge`, etc. (barrel `index.ts`) |
| `src/constants/`             | Content as data. `kdf-info.ts`, `projects.ts`, `routes.ts`, `skills.ts` (edit content here, not in JSX) |
| `src/types/portfolio.ts`     | Shared TS types (e.g. `Project`)                                          |
| `src/utils/`                 | `cn.ts` (`className` merge), `binaryGlyph.ts` (every 0 and 1 on the site), `blobSprite.ts` (glow sprites, canvas sizing, reduced motion check), `playOnce.ts` + `useRevisit.ts` (what has already played in this tab), `useLoaderSeen.ts` |
| `src/app/globals.css`        | Tailwind layer + theme tokens                                            |
| `scripts/bump_version.py`    | Lockstep `VERSION` + `package.json` + `package-lock.json` version bumper (driven by `make bump-*`) |
| `.github/workflows/`         | `ci.yml`, `codeql.yml` (gated), `cd.yml` (Pages deploy), `release.yml`   |

## Critical rules

1. **Keep it simple.** This is a static presentation site. Do not over-engineer. No DB, no auth, no backend, no server runtime.
2. **No `any`.** Use proper TypeScript types, `tsc --noEmit` must stay clean.
3. **Named exports preferred.** Default exports only for Next.js `page.tsx` / `layout.tsx` (and where a framework demands it).
4. **Content lives in `src/constants/`.** Edit copy, project lists, and links there, not hard coded in components.
5. **Honor the static export constraints.** No server only APIs, no dynamic server rendering, `images.unoptimized`, and asset paths must respect the `/kriegerdataforge-portfolio` `basePath`.
6. **Stay on theme.** Background `#0a0704`, amber `#f59e0b` (forge fire), electric blue `#3b82f6` (data streams), amber↔blue animated gradient text.
7. **`VERSION` and `package.json` version must match.** Bump via the Make targets only (they write all three of `VERSION`, `package.json`, and `package-lock.json` in lockstep), CI's version-check fails if `VERSION` and `package.json` diverge.
8. **EmailJS keys are public by design** but still come from `NEXT_PUBLIC_EMAILJS_*` secrets/env. Never hard code real IDs, `.env.local` is gitignored, `.env.local.example` holds placeholders.
9. **Motion runs because something happened, then stops.** Arrival, a scroll, a hover, a click. Nothing new runs continuously, because the ember background already takes most of the frame budget. Every animation checks `prefersReducedMotion()` and shows its finished state instead, with a backstop in the reduced motion block of `globals.css`. The home loader covers the whole screen, so while it is fully opaque it sets `LOADER_COVERING` (from `useLoaderSeen.ts`) on `<html>` and `EmberField` idles under it, lifting the mark as the fade starts. Measured at 1280x900, the loader holds 60fps at 63% of the main thread with the background idling and saturates at 99% without, so anything else that covers the page should do the same.
10. **Digits go through `drawGlyph`, and nothing uses canvas `shadowBlur`.** A shadowed draw costs in proportion to the whole canvas, measured at 494ms a frame for 140 digits on a full screen canvas against 2ms with the stamped glow `drawGlyph` uses now.
11. **A canvas that overlays a masked element is its sibling, never its child**, or the mask cuts the canvas away too. A `position: fixed` canvas is portalled to `document.body`, because pages sit inside `Reveal` and the page transition, both of which leave a transform on an ancestor and make `fixed` relative to it.
12. **Page text never changes for an effect.** Search engines and screen readers get the real words. Scrambles are painted on a canvas or from a data attribute, and the real text is masked or hidden with opacity, never replaced.
13. **What plays on arrival plays once per tab.** A page's entrance, the wordmark strike, the binary stat, a forged heading, and each timeline marker's strike play the first time, a reload or a return to the page shows them finished, and only a new tab plays them again. The owner asked for this to cut animation fatigue. A page's entrance is decided before the first paint by the head script in `layout.tsx`, which sets `data-revisit` on `<html>`, because deciding it after React loads shows the entrance start and then get cut off. Everything else records itself with `hasPlayed` and `markPlayed` from `src/utils/playOnce.ts` at the moment it actually plays. The ember background and anything answering the visitor's own hover or click are exempt.

## Commands

`make` on its own prints the full grouped list. The reasoning is in
[`docs/reference/MAKEFILE.md`](docs/reference/MAKEFILE.md).

**Hot reload development is Docker only. There is no `make dev`.** `build` and `serve-static`
stay on the host on purpose. `out/` is what GitHub Pages actually serves, so previewing the real
export beats any dev server.

| Task            | Command                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| Dev container   | `make docker-up` -> http://localhost:3003/kriegerdataforge-portfolio    |
| Build (export)  | `make build` (`npm run build` -> `out/`)                                |
| Preview build   | `make serve-static` (serves `out/` on :4174)                            |
| Lint            | `make lint` (`npm run lint` -> `eslint .`)                              |
| Type check      | `make typecheck` (`tsc --noEmit`)                                       |
| Full CI (local) | `make ci` (`ci-lint`, `ci-style`, `ci-typecheck`, `ci-build`, `ci-npm-audit`) |
| CodeQL locally  | `make codeql-db` then `make codeql-scan-all`                            |
| Version bump    | `make bump-patch` (or `make bump-minor` / `make bump-major`)            |

## Required reading

1. [`README.md`](./README.md). What this site is, tech stack, CI/release, and the GitHub Pages deploy gates.
2. [`src/constants/kdf-info.ts`](src/constants/kdf-info.ts). The canonical KDF brand statement. Tagline, mission, founder, and the ecosystem framing this site exists to communicate.
3. [`src/constants/projects.ts`](src/constants/projects.ts). The live KDF apps and the platform story (FastAPI/PostgreSQL backbone) you're showcasing.
4. [`next.config.ts`](./next.config.ts). Static export + `basePath`/`assetPrefix` constraints that govern every change.
5. [`skills.md`](./skills.md). The ecosystem security playbook (read before any security sensitive work).

Quick lookups. Theme tokens → `src/app/globals.css`. Content/copy → `src/constants/`. Shared types → `src/types/portfolio.ts`. Contact form wiring → `src/components/ui/ContactForm.tsx` + `.env.local.example`.

## How to work in this repo, the agent kit

**Every task follows the tiered loop in [`WORKFLOW.md`](./WORKFLOW.md).** Pick a lane:

- **Quick.** Tiny, no behavior change → implement → `make ci` → PR.
- **Standard.** A one repo feature → orient → **plan & owner approves** → implement → `make ci`
  green (+ version bump) → PR → **GitHub CI green** → **owner merges**.
- **Epic.** Complex/novel design or anything that **spans repos** → the design gate + cross repo
  coordination below.

Don't skip the plan approval gate. Don't self-merge. The supporting kit:

- [`docs/agent/DESIGN_AND_EPICS.md`](docs/agent/DESIGN_AND_EPICS.md). The **design gate** (design
  doc + ADR, owner approved before code) and the **cross repo epic playbook** (blast radius,
  contract first ordering, flag gated slices). **Cross repo epic trackers live in the ecosystem hub
  at `kriegerdataforge/docs/epics/`.**
- [`docs/agent/DEFINITION_OF_DONE.md`](docs/agent/DEFINITION_OF_DONE.md). The change type scaled
  **Definition of Done** (checkbox form in
  [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md)).
- [`docs/agent/templates/`](docs/agent/templates/). Copy paste **design-spec**, **ADR**, and
  **epic tracker** templates. ADRs land in `docs/CHANGELOG_AND_DECISION_LOG.md` (create if absent).

### Before opening a PR (this repo)

- [ ] `make ci` is green locally, `ci-lint`, `ci-typecheck` (`tsc --noEmit`), `ci-build` (static export), and `ci-npm-audit` all pass.
- [ ] No `any` types. Named exports used (except `page.tsx` / `layout.tsx`). Content changes live in `src/constants/`.
- [ ] Build respects the static export + `basePath` constraints (asset paths resolve under `/kriegerdataforge-portfolio`), links/sitemap still correct.
- [ ] Theme fidelity preserved (amber/blue accents, forge aesthetic).
- [ ] Version bumped with `make bump-patch` (or `minor`/`major`) so `VERSION` == `package.json` version (the CI version-check requires this).
- [ ] No secrets committed. Real `NEXT_PUBLIC_EMAILJS_*` values stay in gitignored `.env.local` / repo secrets, never in code. Gitleaks scans full history.
- [ ] Anything architectural (build pipeline, deploy, framework upgrade) gets an ADR / design note first.

## Security. Read [`skills.md`](./skills.md)

This repo follows the KriegerDataForge ecosystem **security playbook** in [`skills.md`](./skills.md).
**Before any security sensitive work.** Dependencies/supply-chain, CI/CD or the GitHub Pages deploy
pipeline, secrets/env/config. Open `skills.md` and follow the **scenario** that matches your task.

Non-negotiables for this **no backend static site** (full detail + the scenario rules are in `skills.md`):

- **Nothing secret ever enters the bundle or the repo.** A static export ships every byte to the
  browser, and `NEXT_PUBLIC_*` env vars are **public by definition**, so no real secret may ever be
  an env value here. The only env values used (`NEXT_PUBLIC_EMAILJS_*`) are public by design IDs.
  Real values still live only in gitignored `.env.local` / repo secrets, `.example` files hold
  placeholders, and CI's gitleaks scan covers full history.
- **Dependency / supply chain hygiene.** `npm audit` (high+, prod deps) gates every PR. Keep
  `package-lock.json` authoritative and review lockfile diffs. Dependency bumps go through CI like
  any other change.
- **Deploy pipeline integrity.** The Pages deploy is manual dispatch behind a fail closed
  deployer authorization check and Environment reviewer approval. Never weaken those gates, and
  keep the static-export/`basePath` build integrity intact.
- Found a security issue? **Verify it's real, then flag it**, and **pause for owner approval before any
  architectural, destructive, or behavior changing edit**.
- The playbook's server side rules. Auth/OIDC/tokens, BFF/proxy/cookies, backend authz,
  server authoritative recomputation. Are **ecosystem wide rules that do not apply to this
  no backend static site**. See [`skills.md`](./skills.md) if a change ever grows such a surface.
