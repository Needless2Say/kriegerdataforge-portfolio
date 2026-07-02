"use client";

import { useEffect, useState } from "react";
import { useLoaderSeen } from "@/utils/useLoaderSeen";

const REVEAL_MS = 2800 + 700 + 0; // DISPLAY_MS + FADE_MS

/**
 * Fades the home content in once the intro loader hands off. `useLoaderSeen`
 * (SSR-safe, no `setState` in an effect) is `true` the moment the loader was
 * already seen this session or fires `loader-done`. A local timer is only a
 * fallback that reveals the content if that hand-off never arrives; its
 * `setState` runs inside the timeout callback, not synchronously in the effect.
 */
export default function HomeContentReveal({ children }: { children: React.ReactNode }) {
	const seen = useLoaderSeen();
	const [fallbackElapsed, setFallbackElapsed] = useState(false);

	useEffect(() => {
		if (seen) return;
		const t = setTimeout(() => setFallbackElapsed(true), REVEAL_MS);
		return () => clearTimeout(t);
	}, [seen]);

	const visible = seen || fallbackElapsed;

	return (
		<div className={`transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}>
			{children}
		</div>
	);
}
