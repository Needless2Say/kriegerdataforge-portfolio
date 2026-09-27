export const KDF_INFO = {
	name: "KriegerDataForge",
	shortName: "KDF",
	tagline: "A personal platform where my apps use one sign in, shared packages, and the same build and deploy setup.",
	description: "KriegerDataForge is a personal platform I build and use for my own apps. They all share one sign in, handled by an identity provider built on OAuth 2.0 and OIDC. Code the apps have in common lives in shared packages, so it only has to be written once. Those are in Python and npm for now, with room for other languages as I need them. Terraform and one CI/CD library keep every repository built and deployed the same way.",
	why: "Building apps is a passion of mine, and I wanted to stop starting each one from scratch. Keeping them all on one organized system makes them simpler to manage and maintain, and lets them work together without piles of manual work.",
	access: "For my own apps",
	founder: "Arthur Krieger",
	since: "2024",
	links: {
		github:   "https://github.com/Needless2Say",
		linkedin: "https://www.linkedin.com/in/arthur-krieger-3b986220a/",
		email:    "kriegear@umich.edu",
		portfolio: "https://needless2say.github.io/arthurs-portfolio",
	},
} as const;

/*
	Facts about the platform, not business metrics. The old set led with
	"3+ Live Apps", which was both a claim the platform cannot back up yet and
	exactly the kind of thing that makes a personal project read like a company.
*/
export const STATS = [
	{ value: "18",           label: "Repositories" },
	{ value: "Personal",     label: "Platform" },
	{ value: "OIDC",         label: "Identity Provider" },
	{ value: "Python + npm", label: "Shared Packages" },
] as const;