/*
	Motion that plays once per tab.

	Anything on the site that animates because a page arrived or something
	came into view plays once per tab. After that, reloading or coming back to
	the page shows it finished and still, and only a new tab sees it again. A
	tab's sessionStorage lives exactly as long as the tab, so that is where the
	record of what has played is kept.

	It is decided in two places.

	A page's entrance is decided before the first paint. The script below runs
	in the head of every page and marks the document with `data-revisit` when
	the page has already been loaded in this tab, and the stylesheet draws a
	return visit finished from its very first frame. Deciding it once React
	had loaded would be too late, because the entrance would already be
	playing and would be seen being cut off.

	Everything else keys itself. A heading being forged, the wordmark being
	struck, a timeline marker being hit, each records itself under its own id
	at the moment it actually plays. A heading the visitor never scrolled to
	on their first visit still gets forged the first time they do.

	Storage can be missing, or throw, in a private window or with site data
	blocked. Every access is guarded, and without storage the site behaves as
	it always did, with every animation playing each time.
*/

const KEY_PREFIX = "kdf_played_v1:";

export const REVISIT_ATTRIBUTE = "data-revisit";

/**
 * The head script that flags a return visit before the first paint.
 *
 * Rendered inline by the root layout. It records the page's own visit on
 * the first load, and on any later load in the same tab it sets
 * `data-revisit` on the document instead. Kept to plain ES5, because it runs
 * before anything else on the page has loaded.
 */
export const PAGE_VISIT_SCRIPT =
	"(function(){try{" +
	'var p=location.pathname.replace(/\\.html$/,"").replace(/\\/+$/,"")||"/";' +
	`var k=${JSON.stringify(`${KEY_PREFIX}page:`)}+p;` +
	`if(sessionStorage.getItem(k))document.documentElement.setAttribute(${JSON.stringify(REVISIT_ATTRIBUTE)},"");` +
	'else sessionStorage.setItem(k,"1")' +
	"}catch(e){}})();";

/**
 * The current page's path, the same for /about, /about/ and /about.html.
 *
 * Returns:
 *     The pathname with any `.html` and trailing slash removed.
 */
function pagePath(): string {
	return location.pathname.replace(/\.html$/, "").replace(/\/+$/, "") || "/";
}

/**
 * An id for one animation on the current page.
 *
 * Args:
 *     name: What the animation is, unique within its page.
 *
 * Returns:
 *     The name scoped to the page, so two pages can use the same name.
 */
export function playId(name: string): string {
	return `${pagePath()}#${name}`;
}

/**
 * Whether an animation has already played in this tab.
 *
 * Args:
 *     id: From `playId`.
 *
 * Returns:
 *     `true` if it has. `false` if it has not, or if storage is unavailable.
 */
export function hasPlayed(id: string): boolean {
	try {
		return sessionStorage.getItem(KEY_PREFIX + id) !== null;
	} catch {
		return false;
	}
}

/**
 * Record that an animation has played, for the rest of this tab's life.
 *
 * Args:
 *     id: From `playId`.
 *
 * Callers still keep their own flag for the current page view. If storage
 * is unavailable this records nothing, and the animation must not replay
 * within the same view just because the write failed.
 */
export function markPlayed(id: string): void {
	try {
		sessionStorage.setItem(KEY_PREFIX + id, "1");
	} catch {
		// Nothing to fall back to. The next page load plays it again.
	}
}

/**
 * Whether this page was already loaded earlier in this tab.
 *
 * Returns:
 *     `true` on a return visit, as flagged by the head script.
 */
export function isRevisit(): boolean {
	return document.documentElement.hasAttribute(REVISIT_ATTRIBUTE);
}
