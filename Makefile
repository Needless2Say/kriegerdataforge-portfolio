.PHONY: help setup install dev build serve-static lint typecheck check-all clean clean-install \
        docker-up docker-up-build docker-build docker-build-no-cache docker-down docker-logs \
        ci ci-lint ci-typecheck ci-build ci-npm-audit \
        .ensure-venv venv bump-patch bump-minor bump-major
.DEFAULT_GOAL := help

# ========================================
# Color Output
# ========================================

BLUE   := \033[0;34m
GREEN  := \033[0;32m
YELLOW := \033[1;33m
RED    := \033[0;31m
NC     := \033[0m

# ========================================
# Python (for the version-bump scripts only)
# ========================================

PYTHON_VERSION ?= 3.13

ifeq ($(OS),Windows_NT)
    VENV_BIN := .venv/Scripts
    PY_CMD   := py -$(PYTHON_VERSION)
else
    VENV_BIN := .venv/bin
    PY_CMD   := python$(PYTHON_VERSION)
endif

PYTHON := $(VENV_BIN)/python
PIP    := $(VENV_BIN)/pip

# ========================================
# Help
# ========================================

help: ## Show this help message
	@printf "$(BLUE)========================================$(NC)\n"
	@printf "$(BLUE)  KriegerDataForge Portfolio — Makefile$(NC)\n"
	@printf "$(BLUE)========================================$(NC)\n"
	@printf "\n"
	@printf "$(GREEN)Available commands:$(NC)\n"
	@printf "\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-25s$(NC) %s\n", $$1, $$2}'
	@printf "\n"

# ========================================
# Setup & Installation
# ========================================

setup: ## Full project bootstrap — install dependencies
	@printf "$(BLUE)========================================$(NC)\n"
	@printf "$(BLUE)  KriegerDataForge Portfolio — Setup$(NC)\n"
	@printf "$(BLUE)========================================$(NC)\n"
	@printf "\n"
	@printf "$(GREEN)Checking Node.js version...$(NC)\n"
	@node --version || (printf "$(RED)ERROR: Node.js is not installed.$(NC)\n" && exit 1)
	@printf "\n"
	@printf "$(GREEN)[1/1] Installing dependencies...$(NC)\n"
	npm install
	@printf "\n"
	@printf "$(GREEN)Setup complete!$(NC)\n"
	@printf "\n"
	@printf "$(BLUE)========================================$(NC)\n"
	@printf "$(GREEN)  Project is ready!$(NC)\n"
	@printf "$(BLUE)========================================$(NC)\n"
	@printf "\n"
	@printf "$(YELLOW)Next steps:$(NC)\n"
	@printf "  • Local dev:    $(GREEN)make dev$(NC)\n"
	@printf "  • Docker dev:   $(GREEN)make docker-up$(NC)  → http://localhost:3003/kriegerdataforge-portfolio\n"
	@printf "  • Static build: $(GREEN)make build$(NC)\n"
	@printf "\n"

install: ## Install all dependencies
	@printf "$(GREEN)Installing dependencies...$(NC)\n"
	npm install
	@printf "$(GREEN)Done!$(NC)\n"

# ========================================
# Development
# ========================================

dev: ## Start Next.js dev server locally (non-Docker)
	@printf "$(GREEN)Starting development server...$(NC)\n"
	npx next dev --turbopack

# ========================================
# Build & Production
# ========================================

build: ## Run static export build (outputs to out/)
	@printf "$(GREEN)Building static export...$(NC)\n"
	npx next build

serve-static: ## Serve the out/ directory locally (preview the static build)
	@printf "$(GREEN)Serving static build at http://localhost:4174 ...$(NC)\n"
	npx serve out -p 4174

# ========================================
# Quality Checks
# ========================================

lint: ## Run ESLint
	@printf "$(GREEN)Running linter...$(NC)\n"
	npm run lint

typecheck: ## Run TypeScript type checking only
	@printf "$(GREEN)Running type checker...$(NC)\n"
	npx tsc --noEmit

check-all: ## Run lint + typecheck
	@printf "$(BLUE)========================================$(NC)\n"
	@printf "$(BLUE)  Running Full Quality Check$(NC)\n"
	@printf "$(BLUE)========================================$(NC)\n"
	@printf "\n"
	@printf "$(GREEN)[1/2] Linting...$(NC)\n"
	npm run lint
	@printf "\n"
	@printf "$(GREEN)[2/2] Type checking...$(NC)\n"
	npx tsc --noEmit
	@printf "\n"
	@printf "$(GREEN)All checks passed!$(NC)\n"

# ========================================
# CI Checks
# ========================================

ci-lint: ## CI: ESLint
	@printf "$(GREEN)CI [1/4]: lint...$(NC)\n"
	npm run lint

ci-typecheck: ## CI: TypeScript type check
	@printf "$(GREEN)CI [2/4]: tsc --noEmit...$(NC)\n"
	npx tsc --noEmit

ci-build: ## CI: Next.js static export build
	@printf "$(GREEN)CI [3/4]: next build...$(NC)\n"
	npm run build

ci-npm-audit: ## CI: npm audit for CVEs
	@printf "$(GREEN)CI [4/4]: npm audit...$(NC)\n"
	npm audit --audit-level=high --omit=dev

ci: ci-lint ci-typecheck ci-build ci-npm-audit ## Run all CI checks locally
	@printf "$(GREEN)========================================$(NC)\n"
	@printf "$(GREEN)  All CI checks passed!$(NC)\n"
	@printf "$(GREEN)========================================$(NC)\n"

# ========================================
# Docker Commands
# ========================================

docker-up: ## Start KDF portfolio dev container
	@printf "$(GREEN)Starting KDF portfolio dev container...$(NC)\n"
	docker compose up -d
	@printf "$(GREEN)Portfolio running at http://localhost:3003/kriegerdataforge-portfolio$(NC)\n"

docker-up-build: ## Rebuild image then start KDF portfolio dev container
	@printf "$(GREEN)Rebuilding KDF portfolio image...$(NC)\n"
	docker compose build
	@printf "$(GREEN)Starting KDF portfolio dev container...$(NC)\n"
	docker compose up -d
	@printf "$(GREEN)Portfolio running at http://localhost:3003/kriegerdataforge-portfolio$(NC)\n"

docker-build: ## Build Docker dev image and force-recreate container
	@printf "$(GREEN)Building Docker dev image...$(NC)\n"
	docker compose build
	docker compose up -d --force-recreate --renew-anon-volumes

docker-build-no-cache: ## Build Docker dev image with no cache (also purges named volumes so node_modules is fresh)
	@printf "$(GREEN)Tearing down containers and named volumes...$(NC)\n"
	docker compose down -v
	@printf "$(GREEN)Building Docker dev image (no cache)...$(NC)\n"
	docker compose build --no-cache
	@printf "$(GREEN)Starting container with fresh volumes...$(NC)\n"
	docker compose up -d

docker-down: ## Stop the KDF portfolio container
	@printf "$(GREEN)Stopping KDF portfolio container...$(NC)\n"
	docker compose down

docker-logs: ## Follow KDF portfolio container logs
	@printf "$(GREEN)Following Docker logs (Ctrl+C to stop)...$(NC)\n"
	docker compose logs -f

# ========================================
# Utilities
# ========================================

clean: ## Remove node_modules, .next, out, and build artifacts
	@printf "$(YELLOW)Cleaning build artifacts...$(NC)\n"
	rm -rf node_modules .next out coverage
	@printf "$(GREEN)Clean complete!$(NC)\n"

clean-install: clean install ## Clean then reinstall (fresh dependency install)

# ========================================
# Python Environment (for version-bump scripts)
# ========================================

.ensure-venv:
	@[ -d "$(VENV_BIN)" ] || $(MAKE) --no-print-directory venv

venv: ## Create Python virtual environment (used by bump-* targets)
	@printf "$(GREEN)Creating Python virtual environment...$(NC)\n"
	@rm -rf .venv
	$(PY_CMD) -m venv .venv
	$(PYTHON) -m pip install --upgrade pip
	@printf "$(GREEN)Virtual environment created at .venv$(NC)\n"

# ========================================
# Version Bumping
# ========================================
# Bumps VERSION + package.json + package-lock.json in lockstep (the CI
# version-check requires VERSION and package.json to match). On Windows prefix
# with PYTHONUTF8=1 if the script ever prints non-ASCII.

bump-patch: .ensure-venv ## Bump patch version (0.0.X) — updates VERSION, package.json, package-lock.json
	@$(PYTHON) scripts/bump_version.py patch

bump-minor: .ensure-venv ## Bump minor version (0.X.0) — updates VERSION, package.json, package-lock.json
	@$(PYTHON) scripts/bump_version.py minor

bump-major: .ensure-venv ## Bump major version (X.0.0) — updates VERSION, package.json, package-lock.json
	@$(PYTHON) scripts/bump_version.py major
