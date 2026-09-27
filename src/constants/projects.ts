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
		description: "The identity service the apps on the platform delegate to, plus the hosted login and consent UI in front of it, so they all share one account and one sign in.",
		longDescription: "The identity service the apps on the platform delegate to, plus the hosted login and consent UI that sits in front of it, so they all share one account and one sign in. It implements the authorization code flow with PKCE, rotating refresh tokens, per client audience isolation, argon2id password hashing, account lockout, signing key rotation, and a login audit log. The UI is a backend for frontend that keeps the service key on the server, so the identity service itself is not reachable from a browser.",
		tech: ["FastAPI", "Python", "OAuth 2.0 / OIDC", "JWT", "argon2id", "PostgreSQL", "Next.js", "TypeScript"],
		status: "security review",
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
			"The shared Python library every app backend installs, so the code they have in common is written once instead of in each app. Its main job is stateless RS256 token verification against the identity provider's JWKS, with no database round trip. It also includes a FastAPI application factory, auth dependencies, ownership checks, pagination, rate limiting, observability, SQLModel database infrastructure, blob storage, email, and log injection sanitization. Every app backend depends on it, so a bug here would reach all of them at once, which is why it is tested more heavily than anything else on the platform.",
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
			"A boutique storefront I am building for my sister, where she will sell curated clothing, books, handmade crafts, art, and accessories. Customers will be able to browse and search the catalog, keep a persistent cart, and move through a two step reserve then pay checkout with order history. A dedicated admin dashboard will let her manage products and orders directly. The server stays authoritative on every price, total, and inventory count, and the checkout is transactional, idempotent, and concurrency safe. Stripe is wired and deliberately inert until it is switched on at launch.",
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
			"A free, simple food and nutrition tracker for casual users and beginners, the people who find paywalls or dense trackers too much.",
		longDescription:
			"A free, simple food and nutrition tracker for casual users and beginners, the people who find paywalls or dense trackers too much. Log meals, track calories and macros against personal goals, and review trends over time, on top of a 41 field food database with a guided food and meal creation wizard and a daily tracker that saves as you type. Nutrition totals are recomputed server side, so numbers submitted by the client are never trusted. This was the first app built on the platform and the one I come back to once the identity layer and the storefront are finished.",
		tech: ["Next.js", "React", "TypeScript", "FastAPI", "Python", "PostgreSQL", "SQLModel"],
		status: "in development",
		category: "Health & Fitness",
		color: "forge",
		links: { github: "https://github.com/Needless2Say" },
	},
	{
		id: "kdf-terraform",
		title: "Infrastructure & CI/CD",
		description:
			"One Terraform configuration declaring every environment, and a centralized CI/CD library every repository on the platform inherits.",
		longDescription:
			"The only place environments are declared. Terraform describes dev and production, which share no keys, databases, or service keys between them, and it is the single repository allowed to write to either of them. Alongside it sits a centralized CI/CD library where deploy behavior, security gates, and version discipline are defined once and inherited by every repository, so a change to how things ship is one edit rather than eighteen. Every deploy is a manual dispatch behind an environment approval gate.",
		tech: ["Terraform", "GitHub Actions", "Docker", "GCP", "Vercel"],
		status: "in development",
		category: "Infrastructure",
		color: "infra",
		links: { github: "https://github.com/Needless2Say" },
	},
	{
		id: "kdf-fmt",
		title: "kdf-fmt",
		description:
			"A Python formatter and linter for the style rules off the shelf tools do not cover, built only on the standard library.",
		longDescription:
			"A Python formatter and linter built only on the standard library's ast and tokenize modules, with no runtime dependencies. It enforces the parts of my house style that off the shelf tools do not cover, including sectioned module preambles, aligned assignment runs, Google docstring contracts, and 120 column canonical wrapping. Rules run in three tiers, auto fixed, blocking, and advisory, and every rule is remappable per project through TOML. It is the style gate across the platform's Python repositories.",
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
			"A searchable game catalog queued up as a future app on the platform, browsing and filtering titles by genre, platform, and rating.",
		longDescription:
			"A searchable game catalog queued up as a future app on the platform, browsing and filtering titles by genre, platform, and rating. Like every other app on the platform it will own no identity of its own, delegating sign in to the identity provider and standing up its own service behind the shared SDK.",
		tech: ["Next.js", "React", "FastAPI", "PostgreSQL"],
		status: "planned",
		category: "Entertainment",
		color: "gray",
		links: { github: "https://github.com/Needless2Say" },
	},
];
