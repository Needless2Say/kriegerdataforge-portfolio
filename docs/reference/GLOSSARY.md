# Glossary - kriegerdataforge-portfolio

> The ecosystem vocabulary, coined KDF terms, ID prefixes, acronyms, and tool shorthand, is
> defined once in the hub's canonical glossary,
> [`docs/reference/GLOSSARY.md`](https://github.com/Needless2Say/kriegerdataforge/blob/main/docs/reference/GLOSSARY.md)
> (local checkout, [`../../../kriegerdataforge/docs/reference/GLOSSARY.md`](../../../kriegerdataforge/docs/reference/GLOSSARY.md)).
> Read that page first. The shared process vocabulary is also in the kit glossary at the end of
> [`../agent/AGENT_OPERATING_STANDARD.md`](../agent/AGENT_OPERATING_STANDARD.md).
>
> This page lists only terms specific to this repo. Coined a new term in this repo's docs? Add it
> here in the same PR. An ecosystem wide term belongs on the canon page instead.

Written 2026-08-22, for humans and AI agents alike.

## Terms specific to this repo

| Term | Definition |
| --- | --- |
| **The forge / data blacksmith brand** | The site's identity, forging raw data into powerful products, rendered as a dark industrial aesthetic. |
| **Forge fire amber / data stream blue** | The two accent colors of the brand, amber for the forge, electric blue for the data streams. |
| **Showcased apps** | The portfolio's featured projects, KDF Core API, Calorie Tracker, Video Game Database, and KDF Analytics Pipeline. |
| **Static export** | The site builds with Next.js `output: "export"`, plain static files for GitHub Pages. |
| **Analytics opt out** | Google Analytics 4 runs unless the browser carries the `ga-opt-out` flag in `localStorage`, documented in `docs/guides/ANALYTICS_OPT_OUT.md`. The personal portfolio reads the same key, so one flag opts a browser out of both sites whenever they share an origin. |
| **`basePath` / `assetPrefix`** | The Next config for deploying under a sub-path. Currently empty (`""`) in `src/constants/routes.ts`, since the site deploys at the `kriegerdataforge.com` domain root. |
| **Not on kdf-net** | This repo deliberately does not join the shared local Docker network, it is a standalone site. |
| **First deploy pending** | The site has not had its first production deploy yet, deploys are manual and owner-gated. |
| **`PL-###`** | A finding id from the 2026 production launch security audit. Where a doc cites one, a control in this repo exists because of that finding, so the id is the thread back to why a guard that looks redundant is deliberate. The register is section 6 of `docs/security/PRODUCTION_LAUNCH_AUDIT_2026-08.md` in the `kriegerdataforge` hub repo, one row per id carrying its area, priority, and current status. |
