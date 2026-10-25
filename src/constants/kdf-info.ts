export const KDF_INFO = {
	name: "KriegerDataForge",
	shortName: "KDF",
	tagline: "A personal toolkit for building my apps, with one sign in, shared packages, and templates to start from.",
	description: "KriegerDataForge is the smithy behind my apps. It is the personal toolkit I use so that no app of mine starts from scratch. They all share one sign in, through my identity provider built on OAuth 2.0 and OIDC, and new apps start from my template repositories, where the backend template already has sign in wired. Code the apps have in common lives in my Python and npm packages, so it is written once. Terraform and a shared CI/CD library build and deploy every repository the same way.",
	why: "Building apps is a passion of mine, and I wanted to stop starting each one from scratch. Keeping them all on one organized system makes them simpler to manage and maintain, and lets them work together without piles of manual work.",
	access: "Personal Smithy",
	founder: "Arthur Krieger",
	since: "2025",
	links: {
		github:   "https://github.com/Needless2Say",
		linkedin: "https://www.linkedin.com/in/arthur-krieger-3b986220a/",
		email:    "kriegear@umich.edu",
		portfolio: "https://needless2say.github.io/arthurs-portfolio",
	},
} as const;

/*
	Facts about KriegerDataForge, not business metrics. The old set led with
	"3+ Live Apps", which was both a claim the site cannot back up yet and
	exactly the kind of thing that makes a personal project read like a company.
*/
export const STATS = [
	{ value: "18",           label: "Repositories" },
	{ value: "OIDC",         label: "Identity Provider" },
	{ value: "Python + npm", label: "Shared Packages" },
	{ value: "Terraform",    label: "Infrastructure" },
] as const;