"use client";

import { useEffect, useRef } from "react";

import { prefersReducedMotion } from "@/utils/blobSprite";
import { cn } from "@/utils/cn";
import { hasPlayed, markPlayed, playId } from "@/utils/playOnce";
import { useLoaderSeen } from "@/utils/useLoaderSeen";

/*
	A number that arrives in binary and decodes itself into decimal.

	The home page says 18 repositories, and for its first moment on screen it
	reads 10010, which is 18 in binary, before the digits scramble and settle.

	The real number is the only text in the page. The binary and the scramble
	are painted by a pseudo element reading a data attribute, which is not page
	text, so search engines index 18 and a screen reader reads 18, never 10010.

	Driven straight through the DOM rather than through React state. Arming has
	to happen at mount, before the hero is visible, and setting state inside an
	effect to do that is what the hooks lint rule forbids.

	Once per tab. A return to the page shows the number, never the binary.
*/

/**
 * The id the decode is recorded under.
 *
 * Args:
 *     value: The number being shown.
 *
 * Returns:
 *     An id for `hasPlayed` and `markPlayed`.
 */
function statId(value: string): string {
	return playId(`stat-${value}`);
}

/** After the hero starts fading in. Lands just after the hammer strike. */
const DECODE_DELAY_MS = 1350;

/** How long the digits scramble while the width folds down. */
const SCRAMBLE_MS = 440;
const FRAME_MS = 45;

/** Decode anyway if the loader hand off never arrives, rather than stay binary. */
const FALLBACK_MS = 7000;

/**
 * Scramble, fold the width down, then hand back to the real number.
 *
 * Args:
 *     slot: The element carrying the painted digits.
 *     target: The number to land on.
 *
 * Runs once per element. The fallback timer and the hand off can both call it,
 * and whichever is second does nothing.
 */
function decode(slot: HTMLSpanElement, target: string): void {
	if (slot.dataset.decoded) return;
	slot.dataset.decoded = "1";
	markPlayed(statId(target));

	const from = (slot.dataset.show ?? target).length;
	slot.dataset.phase = "scramble";

	const started = performance.now();
	const timer = window.setInterval(() => {
		const p = Math.min(1, (performance.now() - started) / SCRAMBLE_MS);
		if (p >= 1) {
			window.clearInterval(timer);
			delete slot.dataset.show;
			delete slot.dataset.phase;
			slot.style.removeProperty("width");
			return;
		}
		const length = Math.max(target.length, Math.round(from + (target.length - from) * p));
		let digits = "";
		for (let i = 0; i < length; i++) digits += Math.floor(Math.random() * 10);
		slot.dataset.show = digits;
		/*
			The slot narrows one digit at a time, in step with the digits. On a
			clock of its own it ran ahead of them, and the scramble spilled out of
			the chip over the label beside it.
		*/
		slot.style.width = `${length}ch`;
	}, FRAME_MS);
}

interface BinaryStatProps {
	value: string;
	className?: string;
}

export default function BinaryStat({ value, className }: BinaryStatProps) {
	const slotRef = useRef<HTMLSpanElement>(null);
	const seen = useLoaderSeen();
	const numeric = /^\d+$/.test(value);

	// Armed at mount, while the hero is still transparent, so 18 is never seen first.
	useEffect(() => {
		const slot = slotRef.current;
		if (!slot || !numeric || prefersReducedMotion() || hasPlayed(statId(value))) return;

		const binary = Number(value).toString(2);
		slot.dataset.phase = "binary";
		slot.dataset.show = binary;
		slot.style.width = `${binary.length}ch`;

		const fallback = window.setTimeout(() => decode(slot, value), FALLBACK_MS);
		return () => window.clearTimeout(fallback);
	}, [numeric, value]);

	useEffect(() => {
		const slot = slotRef.current;
		if (!seen || !slot || slot.dataset.phase !== "binary") return;
		const timer = window.setTimeout(() => decode(slot, value), DECODE_DELAY_MS);
		return () => window.clearTimeout(timer);
	}, [seen, value]);

	return (
		<span ref={slotRef} className={cn("binary-stat", className)}>
			<span className="binary-stat-value">{value}</span>
		</span>
	);
}
