"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Plays a one-time enter animation the first time each route is visited in a
 * session. `PageTransition` remounts `RouteEnter` on every pathname change (via
 * `key`), so the "have I animated this route yet?" decision is captured once per
 * route in state at mount — no ref reads/writes during render — and the seen flag
 * is persisted in an effect (a side effect, kept out of render).
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	return (
		<RouteEnter key={pathname} pathname={pathname}>
			{children}
		</RouteEnter>
	);
}

function hasSeenRoute(pathname: string): boolean {
	if (typeof window === "undefined") return true; // never animate during SSR
	return !!sessionStorage.getItem(`pt_${pathname}`);
}

function RouteEnter({ pathname, children }: { pathname: string; children: React.ReactNode }) {
	// Frozen at mount for this route: a fresh route animates, a revisited one does
	// not. Because this component remounts per route, the initializer re-runs for
	// each new path while staying stable across re-renders of the same path.
	const [shouldAnimate] = useState(() => !hasSeenRoute(pathname));

	useEffect(() => {
		if (typeof window !== "undefined") {
			sessionStorage.setItem(`pt_${pathname}`, "1");
		}
	}, [pathname]);

	return (
		<div className={shouldAnimate ? "animate-page-enter" : undefined}>
			{children}
		</div>
	);
}
