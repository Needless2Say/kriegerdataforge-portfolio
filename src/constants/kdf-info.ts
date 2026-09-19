export const KDF_INFO = {
	name: "KriegerDataForge",
	shortName: "KDF",
	tagline: "A closed personal platform where I can build any app I want, with everything running on one organized system.",
	description: "KriegerDataForge is a personal project I design and build on my own time. It has its own OAuth 2.0 and OIDC identity provider, a shared Python SDK every app backend installs, a Terraform control plane, and the apps built on top of it. It is a closed platform for myself, and I use it for all of my own personal apps.",
	why: "I build it on my own time to make a passion of mine real. One ecosystem where I can build any app I want, where every part of it follows the same organized system, so everything stays simple to manage and maintain and works together seamlessly instead of taking piles of manual work.",
	access: "Closed platform · for all of my own personal apps",
	founder: "Arthur Krieger",
	since: "2024",
	links: {
		github:   "https://github.com/Needless2Say",
		linkedin: "https://www.linkedin.com/in/arthur-krieger-3b986220a/",
		email:    "kriegear@umich.edu",
	},
} as const;

/*
	Facts about the platform, not business metrics. The old set led with
	"3+ Live Apps", which was both a claim the platform cannot back up yet and
	exactly the kind of thing that makes a personal project read like a company.
*/
export const STATS = [
	{ value: "18",        label: "Repositories" },
	{ value: "Closed",    label: "Access" },
	{ value: "OIDC",      label: "Identity Provider" },
	{ value: "Terraform", label: "Control Plane" },
] as const;