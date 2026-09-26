# kriegerdataforge-portfolio, documentation index

KriegerDataForge portfolio / marketing site.

> Organized into the standard KDF docs taxonomy. The agent kit in `docs/agent/` is **centrally managed (kit sync)**, do not edit it locally.

## Guides

How to and operational walkthroughs.

- [Contributor Onboarding, kriegerdataforge-portfolio](guides/CONTRIBUTOR_ONBOARDING.md)
- [Google Analytics self exclusion](guides/ANALYTICS_OPT_OUT.md). The `ga-opt-out` flag that keeps the owner's own browsers out of the numbers, shared with the personal portfolio when the two share an origin

## Reference

Source verified contracts and command surface.

- [Glossary](reference/GLOSSARY.md). Repo specific terms, plus the pointer to the ecosystem canon glossary in the hub (new 2026-08-22)
- [Makefile reference](reference/MAKEFILE.md). Every `make` target, why `build`/`serve-static` stay on the host, why this repo does not join `kdf-net`, the port map, the five CI lanes, and the local CodeQL targets.
