# docs/guides. How to and operational walkthroughs

Step by step guides for working on this repo. Getting set up, running things
locally, and the operational flow a contributor or agent follows. Look here when
you need the *how* (spin up a dev server, get `make ci` green, ship a first PR)
rather than the *why*. The vision and rules live in
[`AGENTS.md`](../../AGENTS.md) and [`WORKFLOW.md`](../../WORKFLOW.md).

| File | What it covers |
| --- | --- |
| [`CONTRIBUTOR_ONBOARDING.md`](CONTRIBUTOR_ONBOARDING.md) | Zero → first PR. Prerequisites, install, `.env.kdf`/EmailJS and `.env.local` setup, `make docker-up`, the five `make ci` gates, version bumping, the module map, and the plan → approve → PR flow. |
| [`ANALYTICS_OPT_OUT.md`](ANALYTICS_OPT_OUT.md) | How to keep your own browsers out of Google Analytics (GA4) with the `ga-opt-out` `localStorage` flag. One flag covers this site and the personal portfolio only while both share an origin. |

New doc here? Add it to [`../README.md`](../README.md) (the docs index) in the same PR.
