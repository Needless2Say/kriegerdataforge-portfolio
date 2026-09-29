import type { SkillGroup } from "@/types/portfolio";

/*
	What the platform is built with, nothing else. The previous list read like a
	general skills inventory and included tools that appear nowhere in these
	repositories, which is both inaccurate here and off topic for a site about
	one platform.
*/
export const SKILL_GROUPS: SkillGroup[] = [
	{
		label: "Frontend",
		color: "data",
		skills: ["Next.js", "React", "TypeScript", "TailwindCSS", "Zod"],
	},
	{
		label: "Backend",
		color: "forge",
		skills: ["FastAPI", "Python", "SQLModel", "PostgreSQL", "Alembic", "Pydantic"],
	},
	{
		label: "Identity",
		color: "system",
		skills: ["OAuth 2.0 / OIDC", "JWT / JWKS", "PKCE", "argon2id"],
	},
	{
		label: "Platform",
		color: "infra",
		skills: ["Terraform", "GitHub Actions", "Docker", "Vercel"],
	},
	{
		label: "Quality Gates",
		color: "gray",
		skills: ["pytest", "ESLint", "kdf-fmt", "CodeQL", "gitleaks"],
	},
];
