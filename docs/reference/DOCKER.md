# Docker Reference - kriegerdataforge-portfolio

> This repo's container stack. What it runs, on which ports, and the decisions behind
> it. The shared rules live in [`DOCKER_CONVENTIONS.md`](../../../kriegerdataforge/docs/reference/DOCKER_CONVENTIONS.md). This file covers
> only what is specific to kriegerdataforge-portfolio.

**Tier C** - standalone Next.js site. Talks to nobody.

---

## What comes up

`make docker-up` builds if needed, starts the stack, and **waits until every service
reports healthy**:

| Service | Image | Host port | Purpose |
| --- | --- | --- | --- |
| `kdf-portfolio` | built from `Dockerfile`, `target: dev` | 3003 | The portfolio site (hot reload) |

- Site, <http://localhost:3003/kriegerdataforge-portfolio>

## Ladder position

The whole stack. No backend, no database, nothing below it, so `docker-up` starts
this and nothing else, and there is no `docker-up-full`.

It deliberately does **not** join `kdf-net`. That network exists so KDF services can
reach each other by name. A standalone site has nobody to call, and joining would add
a dependency for no benefit.

---

## Image structure

Three stages. `base` -> `deps` -> `dev`. **No `runner`**. This site deploys from source,
so a production image would be built by nothing and would rot unnoticed.

| Detail | Why |
| --- | --- |
| `npm ci`, not `npm install` | `ci` installs exactly what `package-lock.json` pins and fails if the manifest and lockfile disagree. `install` is free to resolve something newer, which is how a container silently drifts away from what CI tested. **This repo used `npm install` until 2026-08-09.** |
| `libc6-compat` | Alpine ships musl. Several native Node addons are built against glibc. |
| Source is **not** `COPY`ed into `dev` | It arrives via the compose bind mount, so a copy would just be shadowed. |

## Health checks

Every service defines one, and `docker-up` passes `--wait`, so the target returns only
when the stack actually serves traffic.

```
wget -q -S --spider http://127.0.0.1:3000/ 2>&1 | grep -q 'HTTP/'
interval 10s | timeout 10s | retries 20 | start_period 45s
```

Three details, each of which broke a check during this pass:

- **`-S --spider` + `grep 'HTTP/'`, not a bare `--spider`.** Bare spider treats any
  non-2xx as failure, so an app that 307s an unauthenticated request to `/login` reports
  unhealthy forever while serving perfectly. The liveness question for a dev container is
  "did the HTTP server answer", not "was it a 200".
- **45s grace, 20 retries.** In dev the *first* request compiles the route. A tight
  `start_period` marks a healthy container unhealthy while webpack is still working.
- **`127.0.0.1`, not `localhost`.** On a dual stack container `localhost` can resolve to
  `::1` while the server listens on `0.0.0.0` only.

`wget`, not `curl`. `node:alpine` ships no curl.

The site deploys at the domain root (`kriegerdataforge.com`, no `basePath`), so the
healthcheck probes `/` directly.

---

## Targets

See [`MAKEFILE.md`](MAKEFILE.md) for the full list. The Docker specific ones:

| Target | Does |
| --- | --- |
| `docker-up` | Start the stack, **rebuild if the Dockerfile changed**, **wait until healthy** |
| `docker-up-build` | **Resets the dev volumes** (`down -v`), rebuilds, then starts - the target for a changed `package.json`/lockfile, or wedged containers |
| `docker-build-no-cache` | The above **plus `--no-cache`** - when you suspect the layer cache itself |
| `docker-stop` / `docker-down` | Stop / stop **and remove** |
| `docker-ps` | This stack's containers and their health |
| `docker-logs` | Follow logs |
| `docker-shell` | Shell inside `kdf-portfolio` |
| `docker-clean` | Remove containers, local images **and volumes** |
| `docker-validate` | `docker compose config -q` - run after editing the compose file |

> **Why the build variants run `down -v` first.** `node_modules` and `.next` are NAMED
> volumes, and a named volume repopulates from the image only when *empty* - after a
> dependency change, a plain rebuild leaves the OLD `node_modules` mounted over the fresh
> image's (`Module not found`). These projects contain no database, so `down -v` loses
> nothing precious. Tier A repos do NOT do this. Their volumes are data.

**`docker-up` passes `--build`.** `docker compose up -d` on its own does *not* rebuild
when the Dockerfile changes. It builds only when the image is missing, so pulling a
branch that edits the Dockerfile silently starts the stale image. Observed during this
pass. `tini` was in the Dockerfile while PID 1 was still `sh`.

`docker-validate` is **not** part of `make ci`. It reads the gitignored `.env.local`, and
`.env.kdf` when present, so a CI job could not run it, and a local only lane would make `make ci`
stricter than GitHub CI.

---

## Related

- [`../../../kriegerdataforge/docs/reference/DOCKER_CONVENTIONS.md`](../../../kriegerdataforge/docs/reference/DOCKER_CONVENTIONS.md) - the ecosystem standard
- [`MAKEFILE.md`](MAKEFILE.md) - every target
