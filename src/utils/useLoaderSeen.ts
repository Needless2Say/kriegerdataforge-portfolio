"use client";

import { useSyncExternalStore } from "react";

/**
 * The intro forge loader runs once per browser session. Whether it has already
 * played is external, mutable state (a `sessionStorage` flag flipped by
 * `HomeLoader`, announced via the `loader-done` window event). Reading it with
 * `useSyncExternalStore` is the React-sanctioned way to subscribe to an external
 * store: it is SSR-safe (a stable server snapshot matching the pre-hydration
 * markup) and it re-renders subscribers when the loader finishes, without a
 * synchronous `setState` inside an effect.
 */

const STORAGE_KEY = "kdf_loader_v1";

function subscribe(onChange: () => void): () => void {
	// The loader flips the flag and fires `loader-done` on completion/skip; the
	// `storage` event covers the (rare) cross-tab case.
	window.addEventListener("loader-done", onChange);
	window.addEventListener("storage", onChange);
	return () => {
		window.removeEventListener("loader-done", onChange);
		window.removeEventListener("storage", onChange);
	};
}

function getSeenSnapshot(): boolean {
	return !!sessionStorage.getItem(STORAGE_KEY);
}

function getShouldPlaySnapshot(): boolean {
	return !sessionStorage.getItem(STORAGE_KEY);
}

// On the server (static export prerender) `sessionStorage` is unavailable. Both
// hooks report their pre-hydration value there: the loader is "not yet seen" and
// "not playing", matching the initial client markup React hydrates against.
function serverFalse(): boolean {
	return false;
}

/** `true` once the intro loader has finished (or was already seen this session). */
export function useLoaderSeen(): boolean {
	return useSyncExternalStore(subscribe, getSeenSnapshot, serverFalse);
}

/**
 * `true` when the intro loader should be playing — i.e. on the client and not yet
 * seen this session. `false` during SSR and after the loader completes, so the
 * loader renders nothing in the prerendered HTML (unchanged from before).
 */
export function useLoaderShouldPlay(): boolean {
	return useSyncExternalStore(subscribe, getShouldPlaySnapshot, serverFalse);
}
