import type { SkillGroup } from "@/types/portfolio";

export const SKILL_GROUPS: SkillGroup[] = [
	{
		label: "Data Engineering",
		color: "forge",
		skills: ["Python", "SQL", "Snowflake", "Databricks", "Apache Spark", "dbt", "Airflow"],
	},
	{
		label: "Backend",
		color: "data",
		skills: ["FastAPI", "PostgreSQL", "SQLAlchemy", "Pydantic", "REST APIs", "Redis"],
	},
	{
		label: "Frontend",
		color: "data",
		skills: ["Next.js", "React", "TypeScript", "TailwindCSS", "Zustand"],
	},
	{
		label: "Cloud & Infrastructure",
		color: "infra",
		skills: ["Azure", "AWS", "Docker", "Kubernetes", "GitHub Actions", "Terraform"],
	},
	{
		label: "Machine Learning",
		color: "system",
		skills: ["PyTorch", "scikit-learn", "Pandas", "NumPy", "Jupyter"],
	},
];
