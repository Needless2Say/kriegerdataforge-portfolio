export const ROUTES = {
	HOME:     "/",
	PROJECTS: "/projects",
	ABOUT:    "/about",
	CONTACT:  "/contact",
} as const;

export const NAV_LINKS = [
	{ name: "Home",     path: ROUTES.HOME     },
	{ name: "Projects", path: ROUTES.PROJECTS },
	{ name: "About",    path: ROUTES.ABOUT    },
	{ name: "Contact",  path: ROUTES.CONTACT  },
] as const;
