"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { useLoaderSeen } from "@/utils/useLoaderSeen";
import { useRevisit } from "@/utils/useRevisit";

const REVEAL_MS = 2800 + 700 + 0; // DISPLAY_MS + FADE_MS

/**
 * Fades the home content in once the intro loader hands off. `useLoaderSeen`
 * (SSR-safe, no `setState` in an effect) is `true` the moment the loader was
 * already seen this session or fires `loader-done`. A local timer is only a
 * fallback that reveals the content if that hand-off never arrives; its
 * `setState` runs inside the timeout callback, not synchronously in the effect.
 *
 * A return visit to the page in the same tab does not fade at all. The
 * content is there from the first paint, held visible by the stylesheet
 * until React loads (see playOnce.ts).
 */
export default function HomeContentReveal({ children }: { children: React.ReactNode }) {
	const seen = useLoaderSeen();
	const revisit = useRevisit();
	const [fallbackElapsed, setFallbackElapsed] = useState(false);

	useEffect(() => {
		if (seen || revisit) return;
		const t = setTimeout(() => setFallbackElapsed(true), REVEAL_MS);
		return () => clearTimeout(t);
	}, [seen, revisit]);

	const visible = revisit || seen || fallbackElapsed;

	return (
		<div className={cn(
			"home-content-reveal",
			!revisit && "transition-opacity duration-700",
			visible ? "opacity-100" : "opacity-0",
		)}>
			{children}
		</div>
	);
}
