import type { Project } from "@/types/portfolio";

export const KDF_PROJECTS: Project[] = [
	{
		id: "kdf-backend",
		title: "KDF Core API",
		description:
			"Shared FastAPI + PostgreSQL backend powering every KDF application. Handles auth, data models, and RESTful endpoints for all downstream frontends.",
		longDescription:
			"The backbone of the entire KriegerDataForge platform. A production-grade FastAPI service with PostgreSQL persistence, Docker containerization, and a modular router structure that makes adding new apps frictionless.",
		tech: ["FastAPI", "PostgreSQL", "Docker", "Python", "SQLAlchemy", "Pydantic"],
		status: "active",
		category: "Infrastructure",
		color: "infra",
		links: { github: "https://github.com/Needless2Say" },
	},
	{
		id: "calorie-tracker",
		title: "Calorie Tracker",
		description:
			"Macro and calorie tracking app with custom food entries, daily logs, and progress analytics — built on the KDF backend.",
		longDescription:
			"A full-stack fitness app that lets users log meals, track macros, and visualize progress over time. Barcode scanning for packaged foods, custom food creation, and daily calorie targets.",
		tech: ["Next.js", "TypeScript", "FastAPI", "PostgreSQL", "TailwindCSS"],
		status: "active",
		category: "Health & Fitness",
		color: "forge",
		links: { github: "https://github.com/Needless2Say" },
	},
	{
		id: "video-game-db",
		title: "Video Game Database",
		description:
			"Personal gaming library manager with IGDB integration, backlog tracking, ratings, and play-time logging.",
		longDescription:
			"Connects to the IGDB API to pull rich game metadata. Users can manage their backlog, log hours played, rate games, and track completion status across platforms.",
		tech: ["Next.js", "TypeScript", "FastAPI", "PostgreSQL", "IGDB API"],
		status: "active",
		category: "Entertainment",
		color: "data",
		links: { github: "https://github.com/Needless2Say" },
	},
	{
		id: "data-pipeline",
		title: "KDF Analytics Pipeline",
		description:
			"Internal analytics pipeline ingesting app telemetry into a Snowflake data warehouse with dbt transformations and dashboard reporting.",
		longDescription:
			"Aggregates usage metrics from all KDF applications into Snowflake. dbt models transform raw events into clean analytical tables. Dashboards track active users, feature adoption, and performance metrics.",
		tech: ["Python", "Snowflake", "dbt", "Apache Airflow", "SQL"],
		status: "beta",
		category: "Data Engineering",
		color: "system",
		links: { github: "https://github.com/Needless2Say" },
	},
];
