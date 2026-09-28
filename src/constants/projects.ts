import type { Project } from "@/types/portfolio";

/*
	The pieces that actually exist in the repositories, described plainly. The
	previous list included an analytics pipeline that does not exist here, and
	gave everything a live-sounding status.
*/
export const KDF_PROJECTS: Project[] = [
	{
		id: "kdf-identity-provider",
		title: "KDF Identity Provider",
		description: "Single sign on for my apps. Signing in to one signs me in to the rest, and signing out of one signs me out of all of them.",
		longDescription: "The identity service every app on the platform delegates sign in to, plus the hosted login and consent UI in front of it, so they all share one account. It gives the apps single sign on (SSO) and single logout. Signing in to one app starts a session at the login page, and while that session lasts the other apps sign me in without asking for my password again. Signing out of any app signs me out of every app. Each app still gets its own token, and the other apps refuse it. It implements the authorization code flow with PKCE, rotating refresh tokens, argon2id password hashing, account lockout, signing key rotation, and a login audit log. The UI is a backend for frontend that keeps the service key on the server, so browsers talk to the UI rather than to the identity service directly.",
		tech: ["FastAPI", "Python", "OAuth 2.0 / OIDC", "JWT", "argon2id", "PostgreSQL", "Next.js", "TypeScript"],
		status: "live · in development",
		category: "Identity",
		color: "system",
		links: { github: "https://github.com/Needless2Say" },
	},
	{
		id: "kdf-sdk",
		title: "kdf-sdk",
		description:
			"The shared Python library every app backend installs, so the code they have in common is written once instead of in each app.",
		longDescription:
			"The shared Python library every app backend installs, so the code they have in common is written once instead of in each app. At its core it checks the identity provider's tokens against the provider's published signing keys, with no database lookup. It also includes a FastAPI application factory, auth dependencies, ownership checks, pagination, rate limiting, request ids and health checks, SQLModel database setup, blob storage, email, and log injection sanitization. Each backend pins a tagged release, so a new version reaches them one at a time rather than all at once.",
		tech: ["Python", "FastAPI", "SQLModel", "Pydantic", "JWT", "pytest"],
		status: "in development",
		category: "Platform Library",
		color: "forge",
		links: { github: "https://github.com/Needless2Say" },
	},
	{
		id: "tiffanys-space",
		title: "Tiffany's Space",
		description:
			"A boutique storefront I am building for my sister, where she will sell curated clothing, books, handmade crafts, art, and accessories.",
		longDescription:
			"A boutique storefront I am building for my sister, where she will sell curated clothing, books, handmade crafts, art, and accessories. Customers will be able to browse and search the catalog, keep a cart saved to their account, and see their past orders. Checkout takes two steps, first reserving the items and then paying. An admin dashboard will let her manage products, variants, images, and orders. The server works out every price, total, and stock count itself rather than trusting the browser. The reservation runs in one database transaction that locks the items it holds, and a repeated request returns the original order instead of creating a second one. Payments will go through Stripe, which is set up on the server and switched off until the shop opens.",
		tech: ["Next.js", "React", "TypeScript", "TailwindCSS", "FastAPI", "PostgreSQL", "SQLModel", "Stripe"],
		status: "pre-launch",
		category: "Storefront",
		color: "data",
		links: { github: "https://github.com/Needless2Say" },
	},
	{
		id: "calorie-tracker",
		title: "Calorie Tracker",
		description:
			"A simple food and nutrition tracker for casual users and beginners. It logs meals and tracks calories and macros against daily goals.",
		longDescription:
			"A simple food and nutrition tracker for casual users and beginners. It covers logging meals, setting daily calorie and macro goals, and looking back at daily calorie totals for the past week or month. Its food database includes about a thousand foods from USDA data, and each food can hold up to 43 nutrition fields. New foods and meals are added through step by step forms. The daily log saves in the background, and the server recomputes daily totals from what was logged, ignoring any totals the browser sends. It was the first app built on the platform, and it is deployed and in use while I keep building it.",
		tech: ["Next.js", "React", "TypeScript", "FastAPI", "Python", "PostgreSQL", "SQLModel"],
		status: "live · in development",
		category: "Health & Fitness",
		color: "forge",
		links: { github: "https://github.com/Needless2Say" },
	},
	{
		id: "kdf-terraform",
		title: "Infrastructure & CI/CD",
		description:
			"Terraform for the dev and production environments, and a shared CI/CD library that every repository on the platform uses.",
		longDescription:
			"Terraform declares the dev and production environments, the Vercel projects in each, and their settings. The two environments share no databases, signing keys, or service keys. Alongside it is a CI/CD library of reusable GitHub Actions workflows for tests, security scans, version checks, and deploys. Every repository on the platform calls it, so a change to how things are built or deployed is made in one place. Deploys are started by hand and checked against a list of who may deploy, and a production deploy also needs a passing run of the full test suite for that release.",
		tech: ["Terraform", "GitHub Actions", "Docker", "Vercel"],
		status: "in development",
		category: "Infrastructure",
		color: "infra",
		links: { github: "https://github.com/Needless2Say" },
	},
	{
		id: "kdf-fmt",
		title: "kdf-fmt",
		description:
			"A Python formatter and linter for the platform's house style, built only on the standard library.",
		longDescription:
			"A Python formatter and linter built only on the standard library, mainly its ast and tokenize modules, with no runtime dependencies. It formats and checks the platform's Python code to one house style, including sectioned module preambles, aligned assignment runs, Google style docstrings, and wrapping at 120 columns. Each rule either fixes the code, reports an error, or reports a warning, and a project can turn a rule off or change its tier in TOML. It is the style check in CI for the platform's Python repositories, where existing findings are kept in a baseline and only new ones fail the check.",
		tech: ["Python", "ast", "tokenize", "pytest"],
		status: "in development",
		category: "Developer Tooling",
		color: "system",
		links: { github: "https://github.com/Needless2Say" },
	},
	{
		id: "video-game-db",
		title: "Video Game Database",
		description:
			"A searchable game catalog planned as a future app on the platform, for browsing and filtering titles by genre, platform, and rating.",
		longDescription:
			"A searchable game catalog planned as a future app on the platform, for browsing and filtering titles by genre, platform, and rating. Like the other apps, it will sign in through the identity provider and run its own backend on the shared SDK.",
		tech: ["Next.js", "React", "FastAPI", "PostgreSQL"],
		status: "planned",
		category: "Entertainment",
		color: "gray",
		links: { github: "https://github.com/Needless2Say" },
	},
];
