/*
	The deploy prefix. `next.config.ts` imports this, so there is exactly one copy
	of the value and the two can never drift apart.

	It has to be exported at all because internal navigation uses plain anchors
	rather than `next/link`, and a plain anchor has to carry the prefix itself.
*/
export const BASE_PATH = "/kriegerdataforge-portfolio";

export const ROUTES = {
	HOME:     "/",
	PROJECTS: "/projects",
	ABOUT:    "/about",
	CONTACT:  "/contact",
} as const;

/**
 * The href for an internal route, prefix included.
 *
 * Internal navigation deliberately does not use `next/link`. This is a static
 * export, and the RSC payload Next fetches on a client side navigation is not a
 * file the export produces at the path it asks for. It requests
 * `/about/__next.about.__PAGE__.txt` while the export writes
 * `about/__next.about/__PAGE__.txt`, and for the home route it asks for
 * `<basePath>.txt`, which sits outside the deployed directory altogether and
 * can never be served. Every in app navigation therefore fetched a 404, logged
 * a console error, and then fell back to a full page load anyway. Plain anchors
 * do the same navigation without the failed request.
 */
export function hrefFor(path: string): string {
	return path === ROUTES.HOME ? `${BASE_PATH}/` : `${BASE_PATH}${path}`;
}

export const NAV_LINKS = [
	{ name: "Home",     path: ROUTES.HOME     },
	{ name: "Projects", path: ROUTES.PROJECTS },
	{ name: "About",    path: ROUTES.ABOUT    },
	{ name: "Contact",  path: ROUTES.CONTACT  },
] as const;
