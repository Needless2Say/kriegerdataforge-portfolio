# ============================================================
#  kriegerdataforge-portfolio -- Makefile
# ============================================================
#  `make` or `make help` lists every command, grouped in dev flow order.
#  Full usage + the reasoning behind the conventions: docs/reference/MAKEFILE.md
#
#  A static Next.js export deployed to GitHub Pages. Hot-reload dev is DOCKER
#  ONLY, but `build` + `serve-static` stay on the host on purpose: out/ IS the
#  deployed artifact, so previewing it is closer to production than any dev
#  server. See docs/reference/MAKEFILE.md for why that exception exists.
#
#  Fresh clone:
#    make setup && make docker-up      # http://localhost:3003/kriegerdataforge-portfolio
#    make ci                           # the PR gate -- must be green before you push
#
#  Conventions (details in docs/reference/MAKEFILE.md):
#    1. Prerequisites are declared inline on the target that needs them.
#    2. Guards: uses $(PYTHON) -> _ensure-venv; uses $(COMPOSE) -> _ensure-env-local.
#    3. `.PHONY` is declared per section, never as one list at the top.
#    4. Internal helpers are `_`-prefixed; a `# Internal: ...` line sits ABOVE the
#       target (never on the target line), keeping them out of help.
#    5. `## text` = a help line; `##@ Name` = a help group (parsed by `help`).
#       `# ==== / # Name / # ====` marks a region with NO targets, invisible to help.
#    6. ASCII only -- this runs in cp1252 Windows consoles.
# ============================================================

# default target is `help`, Makefile is self documenting
.DEFAULT_GOAL := help

# quieter recursive make, individual recipes need not pass --no-print-directory
MAKEFLAGS += --no-print-directory

# ============================================================
# Variables
# ============================================================

# ---------- Dotenv reader ----------

# Reads a variable from a dotenv file. The first argument is the file, the second is the variable name.
from_env_file  = $(shell grep -E '^[[:space:]]*$(2)=' $(1) | head -1 | cut -d= -f2- | tr -d '\042\047\015 ')
from_env_local = $(call from_env_file,.env.local,$(1))

# ---------- Terminal colors ----------

BLUE   := \033[0;34m
GREEN  := \033[0;32m
YELLOW := \033[1;33m
RED    := \033[0;31m
NC     := \033[0m

# ---------- Ports ----------

# Host ports across the ecosystem -- keep these unique or two stacks cannot run together:
#   3000 fitness-app-frontend  3001 tiffanys-space  3002 kriegerdataforge-auth-ui
#   3003 here                  3004 template-nextjs  3005 arthurs-portfolio
# DEV_PORT also appears in docker-compose.yml's port mapping; change both together.
DEV_PORT     ?= 3003
PREVIEW_PORT ?= 4174
BASE_PATH    := /kriegerdataforge-portfolio

# ---------- Python (bump-* and the kdf-fmt style gate only) ----------

# This is a TypeScript repo; the venv exists solely for those two Python tools.
PYTHON_VERSION ?= 3.14

ifeq ($(OS),Windows_NT)
    VENV_BIN := .venv/Scripts
    PY_CMD   := py -$(PYTHON_VERSION)
else
    VENV_BIN := .venv/bin
    PY_CMD   := python$(PYTHON_VERSION)
endif

# always use venv's python
PYTHON := $(VENV_BIN)/python

# ---------- Docker ----------

# compose docker command (always uses .env.local for local development)
COMPOSE := docker compose --env-file .env.local

# Max seconds docker-up waits for healthy. Generous, a cold first build can pass a
# minute. Override per-run: make docker-up WAIT_TIMEOUT=300
WAIT_TIMEOUT ?= 180

# ---------- CodeQL ----------

# CodeQL database and results directories, language, and query pack
# These are used by the codeql.yml workflow and the local `make codeql` target
CODEQL_DB      := ../codeql/codeql-dbs/kriegerdataforge-portfolio
CODEQL_RESULTS := ../codeql/codeql-results
CODEQL_LANG    := javascript-typescript
CODEQL_PACK    := codeql/javascript-queries

# ---------- Private GitHub repo (kdf-fmt, over pip) ----------

# To download private kdf python packages, reads GH_PACKAGES_PAT from .env.local if not already set in the environment.
# The PAT must be a fine grained token with read access to the kriegerdataforge-fmt repo, NOT a classic token.
# The only token this repo needs, and only pip uses it. There is no private npm
# scope here, so no .npmrc and no GH_NPM_TOKEN.
ifeq ($(GH_PACKAGES_PAT),)
  ifneq ($(wildcard .env.local),)
    GH_PACKAGES_PAT := $(call from_env_local,GH_PACKAGES_PAT)
  endif
endif
export GH_PACKAGES_PAT

# ORDER SENSITIVE: must follow the block above -- `ifneq` is immediate, so moving it earlier
# silently leaves PIP_GIT_AUTH empty and the kdf-fmt install starts failing.
# Process scoped -- never writes the global .gitconfig (that pollution caused 403-on-push
# everywhere). `$$GH_PACKAGES_PAT` resolves in the recipe's shell, so `make -n` never prints
# the secret.
ifneq ($(GH_PACKAGES_PAT),)
  PIP_GIT_AUTH := GIT_CONFIG_COUNT=1 \
    GIT_CONFIG_KEY_0="url.https://__token__:$$GH_PACKAGES_PAT@github.com/.insteadOf" \
    GIT_CONFIG_VALUE_0="https://github.com/"
endif

# ---------- Version gate ----------

# Base branch for version check. Used by `make ci-version-check` to ensure
# the version in VERSION is greater than the last release on the base branch.
BASE_BRANCH ?= main

# ---------- Static analysis commands ----------

# Defined ONCE so the developer-facing target and the CI-parity lane run the exact
# same thing. They used to be two identical copies, which is how a pair silently
# drifts apart -- `lint` called `next lint` here long after `ci-lint` had moved on.
LINT_CMD      := npm run lint
TYPECHECK_CMD := npx tsc --noEmit

# ============================================================
# Canned recipes
# ============================================================

# $(call banner,<title>)
define banner
@printf "$(BLUE)========================================$(NC)\n"
@printf "$(BLUE)  $(1)$(NC)\n"
@printf "$(BLUE)========================================$(NC)\n"
endef

##@ Help

.PHONY: help

help: ## Show this help message
	$(call banner,kriegerdataforge-portfolio - Makefile)
	@awk 'BEGIN { FS = ":.*##" } \
		/^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5); next } \
		/^[a-zA-Z_][a-zA-Z0-9_-]*:.*##/ { printf "  $(GREEN)%-28s$(NC) %s\n", $$1, $$2 } \
		' $(MAKEFILE_LIST)
	@printf "\n"

##@ Setup & Dependencies

.PHONY: _ensure-venv _ensure-env-local venv setup install clean-install

# Internal: create the Python venv on demand (bump-* and ci-style only).
_ensure-venv:
	@[ -d "$(VENV_BIN)" ] || $(MAKE) venv

# Internal: .env.local is gitignored, so a fresh clone has only the example. Copy it once; never
# overwrite. It carries the NEXT_PUBLIC_EMAILJS_* keys the contact form needs -- Next reads
# the file directly, including inside the container via the bind mount. Every target that
# invokes $(COMPOSE) declares this guard: --env-file makes compose refuse to run at all
# when the file is missing, even for `docker-down`.
_ensure-env-local:
	@if [ ! -f .env.local ]; then \
		cp .env.local.example .env.local; \
		printf "$(GREEN)Created .env.local from .env.local.example.$(NC)\n"; \
		printf "$(YELLOW)Fill in the NEXT_PUBLIC_EMAILJS_* values or the contact form stays inert.$(NC)\n"; \
	fi

venv: ## Create the Python virtual environment (bump-* and ci-style only)
	@printf "$(GREEN)Creating Python virtual environment...$(NC)\n"
	@rm -rf .venv
	$(PY_CMD) -m venv .venv
	$(PYTHON) -m pip install --upgrade pip
	@printf "$(GREEN)Virtual environment created at .venv$(NC)\n"

setup: _ensure-env-local install ## Full bootstrap -- .env.local + all dependencies
	$(call banner,kriegerdataforge-portfolio - setup complete)
	@printf "$(YELLOW)Next:$(NC)\n"
	@printf "  1. Fill NEXT_PUBLIC_EMAILJS_* in .env.local (contact form)\n"
	@printf "  2. make docker-up        # hot-reload dev container\n"
	@printf "  3. open http://localhost:$(DEV_PORT)$(BASE_PATH)\n"

install: ## Install all npm dependencies
	@printf "$(GREEN)Installing dependencies...$(NC)\n"
	npm install
	@printf "$(GREEN)All dependencies installed!$(NC)\n"

clean-install: clean install ## Clean then install (fresh dependency install)

##@ Docker -- Stack

.PHONY: docker-up docker-up-build docker-build-no-cache docker-down docker-stop \
        docker-logs docker-ps docker-shell docker-clean docker-validate

# Hot-reload development runs here and nowhere else. This site is standalone: no backend, no
# database, nothing to cascade into -- so there is no docker-up-full, and it deliberately does
# NOT join the shared kdf-net (there is no sibling service it could ever call).

# Two load-bearing flags:
#   --build  bare `up -d` only builds when the image is MISSING -- a Dockerfile edit
#            would silently start the stale image. Warm-cache cost: a second or two.
#   --wait   return only when every service is HEALTHY, so the next scripted command
#            (a migration, a seed, a curl) never races a still-importing server.
docker-up: _ensure-env-local ## Start the dev container -- waits until healthy. Logs: 'make docker-logs'.
	@printf "$(GREEN)Starting KDF portfolio dev container...$(NC)\n"
	$(COMPOSE) up -d --build --wait --wait-timeout $(WAIT_TIMEOUT) $(UP_FLAGS)
	@printf "$(GREEN)Portfolio on http://localhost:$(DEV_PORT)$(BASE_PATH)$(NC)\n"

# Both build variants RESET the dev volumes first: a named volume keeps serving OLD
# node_modules after a rebuild (`Module not found`; --renew-anon-volumes only touches
# anonymous ones). `down -v` removes only THIS project's volumes -- no database here,
# nothing precious. Reach for docker-up-build whenever package.json changed.
docker-up-build: _ensure-env-local ## Rebuild the image and reset dev volumes, then start the dev container
	@printf "$(GREEN)Resetting containers and dev volumes...$(NC)\n"
	$(COMPOSE) down -v
	@printf "$(GREEN)Rebuilding KDF portfolio image...$(NC)\n"
	$(COMPOSE) build
	@$(MAKE) docker-up UP_FLAGS=--force-recreate

# Also drops the named volumes, so node_modules and .next are rebuilt from scratch --
# the usual reason to reach for --no-cache here is a stale dependency tree.
docker-build-no-cache: _ensure-env-local ## Rebuild ignoring the layer cache and purge named volumes, then start
	@printf "$(GREEN)Tearing down containers and named volumes...$(NC)\n"
	$(COMPOSE) down -v
	@printf "$(GREEN)Rebuilding KDF portfolio image (no cache)...$(NC)\n"
	$(COMPOSE) build --no-cache
	@$(MAKE) docker-up

docker-down: _ensure-env-local ## Stop AND REMOVE the dev container (named volumes kept)
	@printf "$(GREEN)Stopping and removing the KDF portfolio container...$(NC)\n"
	$(COMPOSE) down

docker-stop: _ensure-env-local ## Stop the dev container (container stopped, not removed)
	@printf "$(GREEN)Stopping the KDF portfolio container...$(NC)\n"
	$(COMPOSE) stop

docker-logs: _ensure-env-local ## Follow the dev container logs
	@printf "$(GREEN)Following Docker logs (Ctrl+C to stop)...$(NC)\n"
	$(COMPOSE) logs -f

# Project-scoped, unlike bare `docker ps`: answers "is MY stack up?"
docker-ps: _ensure-env-local ## Show this stack's containers and their health
	$(COMPOSE) ps

# The escape hatch. Every repo has one, on the same name, pointed at its primary service.
docker-shell: _ensure-env-local ## Open an interactive shell inside the running kdf-portfolio container
	@printf "$(GREEN)Opening a shell in kdf-portfolio...$(NC)\n"
	$(COMPOSE) exec kdf-portfolio sh

# scoped to THIS project: `docker system prune -af` would wipe every other KDF stack too
docker-clean: _ensure-env-local ## Remove this stack's container, named volumes and local images
	@printf "$(YELLOW)Removing KDF portfolio container, volumes and local images...$(NC)\n"
	$(COMPOSE) down -v --rmi local --remove-orphans

# One-second parse gate. NOT a `make ci` lane: it reads the gitignored .env.local,
# which CI lacks -- a local-only lane would break the `make ci` == GitHub CI mirror.
docker-validate: _ensure-env-local ## Validate docker-compose.yml parses and resolves
	@printf "$(GREEN)Validating docker-compose.yml...$(NC)\n"
	@$(COMPOSE) config -q && printf "$(GREEN)OK: docker-compose.yml is valid.$(NC)\n"

##@ Build & Preview

.PHONY: build serve-static

# These two stay on the host deliberately. out/ IS what GitHub Pages serves, so previewing the
# real export is closer to production than any dev server -- the opposite of the usual
# Docker-only argument. Hot reload still belongs in the container.

build: ## Build the static export (outputs to out/)
	@printf "$(GREEN)Building static export...$(NC)\n"
	npm run build

serve-static: ## Serve out/ locally to preview exactly what GitHub Pages will serve
	@printf "$(GREEN)Serving static build at http://localhost:$(PREVIEW_PORT)$(NC)\n"
	npx serve out -p $(PREVIEW_PORT)

##@ Static Analysis

.PHONY: lint typecheck

lint: ## Run ESLint over the codebase
	@printf "$(GREEN)Running ESLint...$(NC)\n"
	$(LINT_CMD)

typecheck: ## Run the tsc type checker
	@printf "$(GREEN)Running tsc...$(NC)\n"
	$(TYPECHECK_CMD)

##@ Testing

.PHONY: lint typecheck check-all

# No test framework ships here -- this is a static content site. `check-all` is the quick loop;
# `make ci` is the gate.

check-all: lint typecheck ## Run lint + typecheck
	@printf "$(GREEN)All checks passed!$(NC)\n"

##@ CI (local parity with GitHub Actions)

.PHONY: ci-lint ci-style ci-typecheck ci-build ci-npm-audit ci-version-check ci

# The PR gate -- green locally before you push. GitHub CI additionally runs secret-scan,
# version-check and the CodeQL workflow, which need PR context and cannot be reproduced here --
# though the codeql-* targets below reproduce the SCAN itself.

ci-lint: ## CI: ESLint
	@printf "$(GREEN)CI [1/6]: lint...$(NC)\n"
	$(LINT_CMD)

# kdf-fmt owns Python formatting/style (ADR D-003). This is a TypeScript repo, so the gate
# covers scripts/ only (config: kdf-fmt.toml). Installed on demand -- there is no requirements
# file here to carry the pin, so ci.yml's kdf_fmt_ref is the single source.
ci-style: _ensure-venv ## CI: kdf-fmt style check for the Python scripts
	@printf "$(GREEN)CI [2/6]: kdf-fmt style...$(NC)\n"
	@$(PYTHON) -c "import kdf_fmt" 2>/dev/null || $(PIP_GIT_AUTH) $(PYTHON) -m pip install --quiet \
		"kdf-fmt @ git+https://github.com/Needless2Say/kriegerdataforge-fmt.git@$(shell grep -oE 'kdf_fmt_ref:[[:space:]]*v[0-9.]+' .github/workflows/ci.yml | head -1 | grep -oE 'v[0-9.]+')"
	$(PYTHON) -m kdf_fmt.cli check --no-cache

ci-typecheck: ## CI: TypeScript type check
	@printf "$(GREEN)CI [3/6]: tsc --noEmit...$(NC)\n"
	$(TYPECHECK_CMD)

ci-build: ## CI: Next.js static export build
	@printf "$(GREEN)CI [4/6]: next build...$(NC)\n"
	npm run build

ci-npm-audit: ## CI: npm audit for CVEs
	@printf "$(GREEN)CI [5/6]: npm audit...$(NC)\n"
	npm audit --audit-level=high --omit=dev

# Mirrors the CI version-check job. That job compares against the PR's base branch, which
# needs PR context -- this uses origin/$(BASE_BRANCH), which is the same comparison for a
# normal feature branch and catches the usual failure: a forgotten `make bump-*`.
#
# Skips (does not fail) when origin/$(BASE_BRANCH) is not fetched locally, because a missing
# ref is a checkout problem, not a version problem -- CI still enforces it either way.
ci-version-check: _ensure-venv ## CI: version consistency + strict +1 increment vs origin/main (vendored scripts/check_version.py)
	@printf "$(GREEN)CI: version check...$(NC)\n"
	@PYTHONUTF8=1 $(PYTHON) scripts/check_version.py --base-branch "$(if $(BASE_BRANCH),$(BASE_BRANCH),main)"
ci: ci-lint ci-style ci-typecheck ci-build ci-npm-audit ci-version-check ## Run all CI checks locally
	@printf "$(GREEN)========================================$(NC)\n"
	@printf "$(GREEN)  All CI checks passed!$(NC)\n"
	@printf "$(GREEN)========================================$(NC)\n"

##@ Versioning & Release

.PHONY: bump-patch bump-minor bump-major

# Bumps VERSION + package.json + package-lock.json in lockstep (the CI version-check requires
# VERSION and package.json to match, and exactly +1 over the base branch).
#
# PYTHONUTF8=1 is not optional insurance: sibling repos' bump scripts print a U+2705 that
# crashes cp1252 on Windows AFTER writing the files, so the bump looks like a failure having
# already succeeded -- and re-running then bumps a second time.
_BUMP := PYTHONUTF8=1 $(PYTHON) scripts/bump_version.py

bump-patch: _ensure-venv ## Bump the patch version (0.0.X) -- VERSION + package.json + package-lock.json
	@$(_BUMP) patch

bump-minor: _ensure-venv ## Bump the minor version (0.X.0) -- VERSION + package.json + package-lock.json
	@$(_BUMP) minor

bump-major: _ensure-venv ## Bump the major version (X.0.0) -- VERSION + package.json + package-lock.json
	@$(_BUMP) major

##@ CodeQL Security Scanning

.PHONY: codeql codeql-db codeql-scan-security codeql-scan-quality codeql-scan-all \
        codeql-scan-security-csv codeql-scan-quality-csv codeql-scan-csv-all

# CodeQL already runs in CI here (.github/workflows/codeql.yml -> cicd's ci-codeql.yml). These
# targets exist so a finding from that job can be reproduced and iterated on locally.
# SARIF opens in VS Code (SARIF Viewer extension); CSV is easier to hand to an AI.

codeql: codeql-db codeql-scan-all ## Build the CodeQL database and run all query suites (mirrors codeql.yml)

codeql-db: ## Create or refresh the CodeQL database
	$(call banner,CodeQL - building database)
	@mkdir -p $(CODEQL_RESULTS)
	@rm -rf $(CODEQL_DB)
	codeql database create $(CODEQL_DB) \
		--language=$(CODEQL_LANG) \
		--source-root=. \
		--codescanning-config=.github/codeql/codeql-config.yml
	@printf "$(GREEN)Database created at $(CODEQL_DB)$(NC)\n"

codeql-scan-security: ## Run security-extended queries (SARIF)
	$(call banner,CodeQL - security scan)
	@mkdir -p $(CODEQL_RESULTS)
	codeql database analyze $(CODEQL_DB) \
		"$(CODEQL_PACK):codeql-suites/javascript-security-extended.qls" \
		--format=sarif-latest \
		--output=$(CODEQL_RESULTS)/kriegerdataforge-portfolio.sarif
	@printf "$(GREEN)Results: $(CODEQL_RESULTS)/kriegerdataforge-portfolio.sarif$(NC)\n"

codeql-scan-quality: ## Run security-and-quality queries (SARIF)
	$(call banner,CodeQL - quality scan)
	@mkdir -p $(CODEQL_RESULTS)
	codeql database analyze $(CODEQL_DB) \
		"$(CODEQL_PACK):codeql-suites/javascript-security-and-quality.qls" \
		--format=sarif-latest \
		--output=$(CODEQL_RESULTS)/kriegerdataforge-portfolio-quality.sarif
	@printf "$(GREEN)Results: $(CODEQL_RESULTS)/kriegerdataforge-portfolio-quality.sarif$(NC)\n"

codeql-scan-all: codeql-scan-security codeql-scan-quality ## Run all CodeQL query suites (SARIF)

codeql-scan-security-csv: ## Run the security scan (CSV)
	$(call banner,CodeQL - security scan (CSV))
	@mkdir -p $(CODEQL_RESULTS)
	codeql database analyze $(CODEQL_DB) \
		"$(CODEQL_PACK):codeql-suites/javascript-security-extended.qls" \
		--format=csv \
		--output=$(CODEQL_RESULTS)/kriegerdataforge-portfolio.csv
	@printf "$(GREEN)Results: $(CODEQL_RESULTS)/kriegerdataforge-portfolio.csv$(NC)\n"

codeql-scan-quality-csv: ## Run the security-and-quality scan (CSV)
	$(call banner,CodeQL - quality scan (CSV))
	@mkdir -p $(CODEQL_RESULTS)
	codeql database analyze $(CODEQL_DB) \
		"$(CODEQL_PACK):codeql-suites/javascript-security-and-quality.qls" \
		--format=csv \
		--output=$(CODEQL_RESULTS)/kriegerdataforge-portfolio-quality.csv
	@printf "$(GREEN)Results: $(CODEQL_RESULTS)/kriegerdataforge-portfolio-quality.csv$(NC)\n"

codeql-scan-csv-all: codeql-scan-security-csv codeql-scan-quality-csv ## Run all CodeQL query suites (CSV)

##@ Maintenance

.PHONY: git-setup clean clean-deep

git-setup: ## Install the pre-commit hook (ci-style + ci-lint + gitleaks secret scan)
	@printf "$(GREEN)Setting up git hooks...$(NC)\n"
	@echo "#!/bin/sh" > .git/hooks/pre-commit
	@echo "make ci-style" >> .git/hooks/pre-commit
	@echo "make ci-lint" >> .git/hooks/pre-commit
	@echo "# PL-027: scan staged changes for secrets before they land (CI also enforces post-push)." >> .git/hooks/pre-commit
	@echo "if command -v gitleaks >/dev/null 2>&1; then" >> .git/hooks/pre-commit
	@echo "  gitleaks protect --staged --redact || exit 1" >> .git/hooks/pre-commit
	@echo "else" >> .git/hooks/pre-commit
	@echo "  echo '[git-setup] gitleaks not installed; skipping local secret scan (install: https://github.com/gitleaks/gitleaks, or run: pre-commit install). CI still enforces it.'" >> .git/hooks/pre-commit
	@echo "fi" >> .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@printf "$(GREEN)Git hooks installed!$(NC)\n"

# Removes installed dependencies, build output and caches; `make setup` restores them.
clean: ## Remove node_modules, build output and coverage artifacts (keeps .venv)
	@printf "$(GREEN)Cleaning up...$(NC)\n"
	rm -rf node_modules .next out dist coverage build .jest-cache .kdf-fmt-cache
	@printf "$(GREEN)Cleanup complete!$(NC)\n"

# Deliberately NOT guarded by _ensure-venv. This target deletes the venv.
clean-deep: ## Deep clean including virtual environment
	@printf "$(YELLOW)Deep cleaning...$(NC)\n"
	@$(MAKE) clean
	rm -rf .venv/
	@printf "$(GREEN)Deep cleanup complete!$(NC)\n"

