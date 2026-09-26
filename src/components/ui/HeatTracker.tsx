"use client";

import { useEffect } from "react";

/*
	Heat under the cursor.

	Cards marked `data-heat` warm up where the pointer is, like metal with a
	torch held close to it. All of the look is CSS in `globals.css`. This only
	tells each card where the pointer is, through two custom properties.

	One listener for the whole page rather than one per card, so a page full of
	cards costs the same as a page with one. Writes are batched to one per frame
	however fast the pointer moves.

	Desktop only. A phone has no pointer hovering over anything, so the listener
	is never attached there.
*/
export default function HeatTracker() {
	useEffect(() => {
		if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

		let raf = 0;
		let target: HTMLElement | null = null;
		let px = 0;
		let py = 0;

		function apply() {
			raf = 0;
			if (!target) return;
			const box = target.getBoundingClientRect();
			target.style.setProperty("--mx", `${(px - box.left).toFixed(1)}px`);
			target.style.setProperty("--my", `${(py - box.top).toFixed(1)}px`);
		}

		function onMove(event: PointerEvent) {
			const card = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-heat]") : null;
			if (!card) return;
			target = card;
			px = event.clientX;
			py = event.clientY;
			if (!raf) raf = requestAnimationFrame(apply);
		}

		document.addEventListener("pointermove", onMove, { passive: true });
		return () => {
			document.removeEventListener("pointermove", onMove);
			cancelAnimationFrame(raf);
		};
	}, []);

	return null;
}
