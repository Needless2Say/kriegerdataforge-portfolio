export const KDF_INFO = {
	name: "KriegerDataForge",
	shortName: "KDF",
	tagline: "Forging raw data into powerful products.",
	description:
		"KriegerDataForge is a personal software platform built by Arthur Krieger — a shared FastAPI + PostgreSQL backbone powering full-stack applications across fitness, gaming, and data engineering domains.",
	mission:
		"To forge reliable, scalable data systems and applications — treating every pipeline, API, and interface as a craftsman treats metal: with precision, heat, and purpose.",
	founder: "Arthur Krieger",
	founded: "2024",
	location: "Chicago, IL",
	links: {
		github:   "https://github.com/Needless2Say",
		linkedin: "https://www.linkedin.com/in/arthur-krieger-3b986220a/",
		email:    "kriegear@umich.edu",
	},
} as const;

export const STATS = [
	{ value: "3+",      label: "Live Apps" },
	{ value: "FastAPI", label: "Core Backend" },
	{ value: "PostgreSQL", label: "Data Store" },
	{ value: "2024",    label: "Founded" },
] as const;
