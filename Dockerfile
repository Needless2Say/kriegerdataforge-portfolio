# syntax=docker/dockerfile:1
#
# kriegerdataforge-portfolio -- the standalone KDF portfolio site (Next.js). Tier C.
#
# Stages: base -> deps -> dev. NO `runner`: Tier C deploys from source, so a production
# image would be built by nothing and rot.
# Canon: ../kriegerdataforge/docs/reference/DOCKER_CONVENTIONS.md

############################
# 0) base -- pinned image, env, OS packages. No app code, no dependencies.
############################
FROM node:24-alpine AS base

# set working directory to /app
WORKDIR /app

# disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# install the glibc compatibility shim -- several native Node addons fail to load on Alpine's musl without it
RUN apk add --no-cache libc6-compat

############################
# 1) deps -- manifests only, then the install. The cache layer.
############################
FROM base AS deps

# copy dependency manifests and lockfile first to leverage Docker cache for dependencies
COPY package.json package-lock.json* ./

# `npm ci`, not `npm install` -- ci installs exactly what the lockfile pins; install may resolve newer
RUN npm ci

############################
# 2) dev -- hot-reload server. What compose runs.
############################
FROM base AS dev

# run in development mode
ENV NODE_ENV=development

# dependencies live INSIDE the container; compose pairs this with a named volume over /app/node_modules
# so the host bind mount cannot shadow them. The source is bind-mounted at runtime, so it is NOT copied here.
COPY --from=deps /app/node_modules ./node_modules

# expose the app on port 3000
EXPOSE 3000

# 45s grace and 20 retries -- in dev the FIRST request compiles the route. busybox wget: alpine has no curl.
# Probe the basePath -- this site serves under /kriegerdataforge-portfolio and "/" 404s (unhealthy forever).
HEALTHCHECK --interval=10s --timeout=10s --retries=20 --start-period=45s \
    CMD wget -q -S --spider http://127.0.0.1:3000/kriegerdataforge-portfolio/ 2>&1 | grep -q 'HTTP/' || exit 1

# run the dev server with webpack -- Turbopack's file watcher is unreliable over Docker volumes on
# Windows (paired with WATCHPACK_POLLING=true in compose)
CMD ["npx", "next", "dev", "--webpack", "-H", "0.0.0.0", "-p", "3000"]
