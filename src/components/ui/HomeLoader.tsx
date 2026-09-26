"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ForgeFire from "./ForgeFire";
import { LOADER_COVERING, useLoaderShouldPlay } from "@/utils/useLoaderSeen";

const STORAGE_KEY = "kdf_loader_v1";
const DISPLAY_MS  = 2800;
const FADE_MS     = 700;

/**
 * Whether the loader should be on screen is external, session-scoped state read
 * via `useLoaderShouldPlay` (SSR-safe, no `setState` in an effect). While it is
 * playing, only the fade animation is React-owned local state — and every
 * `setPhase` runs inside a timer/handler callback, never synchronously in the
 * effect body.
 *
 * The fire fills the whole screen, and the words sit over it at the top and the
 * bottom edge.
 */
export default function HomeLoader() {
	const shouldPlay = useLoaderShouldPlay();
	// Once playing, the loader fades before it hands off. `false` = fully opaque.
	const [fading, setFading] = useState(false);
	const fadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Reveal the rest of the page (Navbar, content) — used both on the timed
	// hand-off and on skip-click. Stable across renders so effects can depend on it.
	const announceDone = useCallback(() => {
		window.dispatchEvent(new CustomEvent("loader-done"));
	}, []);

	// Persist the "seen" flag. Flipping the sessionStorage value re-runs
	// `useLoaderShouldPlay`/`useLoaderSeen` for every subscriber and unmounts this
	// loader on the next render.
	const markSeen = useCallback(() => {
		sessionStorage.setItem(STORAGE_KEY, "1");
		announceDone();
	}, [announceDone]);

	useEffect(() => {
		if (!shouldPlay) return;

		fadeRef.current = setTimeout(() => setFading(true), DISPLAY_MS);
		hideRef.current = setTimeout(markSeen, DISPLAY_MS + FADE_MS);

		return () => {
			if (fadeRef.current) clearTimeout(fadeRef.current);
			if (hideRef.current) clearTimeout(hideRef.current);
		};
	}, [shouldPlay, markSeen]);

	/*
		While the loader is fully up, nothing behind it can be seen, so the page
		background idles rather than drawing a second screen of fire underneath
		this one. The mark lifts the moment the fade starts, on the timer or on a
		skip, so the background is drawing again before any of it shows.
	*/
	useEffect(() => {
		if (!shouldPlay || fading) return;
		const root = document.documentElement;
		root.setAttribute(LOADER_COVERING, "");
		return () => root.removeAttribute(LOADER_COVERING);
	}, [shouldPlay, fading]);

	function dismiss() {
		if (fadeRef.current) clearTimeout(fadeRef.current);
		if (hideRef.current) clearTimeout(hideRef.current);
		setFading(true);
		// Reveal the page immediately (as before), but only mark the loader seen —
		// which unmounts it — once the fade-out has finished.
		announceDone();
		hideRef.current = setTimeout(markSeen, FADE_MS);
	}

	if (!shouldPlay) return null;

	return (
		<div
			onClick={dismiss}
			className={`fixed inset-0 z-[200] overflow-hidden bg-[#0a0704] cursor-pointer select-none transition-opacity duration-700 ${
				fading ? "opacity-0" : "opacity-100"
			}`}
		>
			{/* The fire, across the whole screen */}
			<div className="absolute inset-0">
				<ForgeFire />
			</div>

			{/* Top loading bar — dark amber → amber → blue gradient reveal */}
			<div
				className="absolute top-0 left-0 right-0 h-1.5 z-10 overflow-hidden"
				style={{ background: "linear-gradient(90deg, #92400e 0%, #f59e0b 60%, #3b82f6 100%)" }}
			>
				<div
					className="absolute right-0 top-0 h-full bg-[#0a0704]"
					style={{ animation: `forge-bar-mask ${DISPLAY_MS}ms linear forwards` }}
				/>
			</div>

			<p className="loader-text absolute top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] sm:text-xs tracking-[0.45em] uppercase text-amber-300/85">
				◈ igniting the forge ◈
			</p>

			<div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 whitespace-nowrap text-center">
				<p className="loader-text font-mono text-[10px] tracking-[0.35em] uppercase text-amber-100/90 animate-pulse">
					FORGING DATA...
				</p>
				<p className="loader-text font-mono text-[10px] tracking-widest uppercase text-amber-50/60">
					tap anywhere to skip
				</p>
			</div>
		</div>
	);
}
