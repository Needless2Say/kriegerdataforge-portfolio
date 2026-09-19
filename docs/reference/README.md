# Reference, kriegerdataforge-portfolio

Source verified reference material. The exact contracts and command surface of this repo. Look
here when you need to know what the rules **are**, not how to perform a task. That is
[`../guides/`](../guides/README.md).

Source code is always ground truth. Where a doc and the code disagree, trust the code.

| Doc | What it covers |
| --- | --- |
| [`DOCKER.md`](DOCKER.md) | This repo's container stack. What it runs, on which ports, the image stages, and the decisions behind them |
| [`GLOSSARY.md`](GLOSSARY.md) | Terms specific to this repo, plus the pointer to the ecosystem canon glossary in the hub (new 2026-08-22). |
| [`MAKEFILE.md`](MAKEFILE.md) | Every `make` target, the two deliberate deviations from the ecosystem norm (host side `build`/`serve-static`, and not joining `kdf-net`), the port map, the five CI lanes, the local CodeQL targets, and the dependency floors. |

New doc here? Add it to [`../README.md`](../README.md) (the docs index) in the same PR.
