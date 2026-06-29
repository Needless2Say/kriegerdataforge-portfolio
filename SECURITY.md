# Security Policy

> Part of the **KriegerDataForge (KDF)** ecosystem — a centralized SSO/OIDC auth platform
> and the apps built on it. We take security seriously; this repo (`kriegerdataforge-portfolio`) follows the
> ecosystem-wide disclosure process below.

## Reporting a Vulnerability

**Please do not open a public issue, pull request, or discussion for a security report.**

Report privately through **GitHub Private Vulnerability Reporting**:

1. Go to this repository's **Security** tab → **Report a vulnerability**.
2. Describe the issue with enough detail to reproduce it (see *What to include* below).

If private reporting is unavailable, contact the repository owner privately through a
non-public channel and mark the message **SECURITY**.

### What to include

- A clear description of the vulnerability and its impact
- Step-by-step reproduction (PoC, request/response, or affected endpoint/route)
- Affected version/commit and configuration (no secret **values** — reference names only)
- Any suggested remediation, if you have one

> ⚠️ Never include live secret values, private keys, or real user data in a report. Reference
> secrets by **name and location** only.

## Our Commitment

- **Acknowledgement:** within **3 business days**.
- **Triage & severity:** within **7 business days**, using a P0–P3 model
  (P0 = active exposure / launch blocker → P3 = hardening).
- **Fix & disclosure:** we aim to remediate P0/P1 issues before any public disclosure and
  will coordinate a disclosure timeline with you. We credit reporters who wish to be named.

## Scope

**In scope for `kriegerdataforge-portfolio`:** This is a static Next.js marketing/portfolio site (static export to GitHub Pages) with no database, no auth, and no backend. Security-relevant surface is standard web hardening only — the static-export/`basePath` build integrity, the client-side EmailJS contact form (`NEXT_PUBLIC_EMAILJS_*` keys are public-by-design), dependency/supply-chain (npm) integrity, and the CI/CD + GitHub Pages deploy pipeline. There are no auth flows, payments, or secrets of consequence.

**Generally out of scope** (across the ecosystem):

- Findings that require a compromised host, a malicious dependency you introduced, or
  physical access
- Automated scanner output without a demonstrated, exploitable impact
- Missing best-practice headers/flags with no concrete exploit
- Social engineering, spam, or volumetric DoS
- Issues in third-party services we integrate but do not control

## Supported Versions

This project ships from `main`; only the latest released version is supported. Security
fixes land on `main` and are rolled out via the standard deploy pipeline.

## Handling Secrets

Secret rotation and git-history hygiene are owner-operated. Contributors must never commit
secret values; pre-commit `gitleaks` and CI secret-scanning are the backstops. See the
ecosystem security playbook (`skills.md`) where present.
