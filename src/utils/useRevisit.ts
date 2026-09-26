"use client";

import { useSyncExternalStore } from "react";

import { isRevisit } from "./playOnce";

/*
	Whether this page was already loaded in this tab, for components that
	render differently on a return visit. The head script sets the flag once,
	before the first paint, and it never changes afterwards, so there is
	nothing to subscribe to. playOnce.ts explains where it comes from.
*/

function subscribe(): () => void {
	return () => {};
}

// The prerender has no tab, so it always renders a first visit.
function serverFalse(): boolean {
	return false;
}

/** `true` on a return visit to this page in this tab. */
export function useRevisit(): boolean {
	return useSyncExternalStore(subscribe, isRevisit, serverFalse);
}
