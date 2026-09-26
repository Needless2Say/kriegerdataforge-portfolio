"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { bitGradient, bitMix, drawGlyph } from "@/utils/binaryGlyph";
import { FLAME_RGB, clearCanvas, fitCanvas, makeBlob, prefersReducedMotion } from "@/utils/blobSprite";
import { hasPlayed, isRevisit, markPlayed, playId } from "@/utils/playOnce";

/*
	A heading forged out of bits.

	The heading's real text is in the page the whole time and is never touched,
	so search engines and screen readers only ever get the words. What changes is
	what can be seen. The heading is masked away, a 0 or 1 is drawn where each
	letter will be, and a hot seam sweeps left to right uncovering the real
	letters behind it, still glowing for a moment after the seam has passed.

	The same split as the burn on the email card. The mask goes on the heading
	and the canvas is a sibling of it, because a canvas inside the heading would
	be cut away by the very mask that is hiding the letters.

	The heading's own glow is switched off while it is masked and fades back in
	afterwards. The mask clips at the heading's box, and the glow reaches past
	it, so leaving it on made the glow appear to snap wider at the end.

	Each heading is forged once per tab, the first time it comes into view.
	After that it is plain text, on this visit and on any return to the page.
*/

/** Width of the soft edge the mask leaves at the seam, in pixels. */
const SEAM = 16;

/** How far the canvas reaches past the letters. */
const PAD = 30;

/** Bits alone on screen before the seam starts to move. */
const HOLD_MS = 300;

/* The sweep takes longer for a longer heading, within limits. */
const PER_CHAR_MS  = 55;
const MIN_SWEEP_MS = 450;
const MAX_SWEEP_MS = 1100;

/** How long the last letters keep glowing after the seam leaves them. */
const TAIL_MS = 320;

/** A beat after the heading comes into view, so the reveal around it has started. */
const START_DELAY_MS = 140;

/**
 * If a forge never reports back, the heading is shown anyway.
 *
 * The heading is invisible while it is armed, so any failure that left it
 * masked would lose the heading entirely. This is the backstop for that.
 */
const SAFETY_MS = 4500;

const MAX_SPARKS = 26;

interface Glyph {
	x: number;       // centre, canvas space
	y: number;
	char: string;
	flipIn: number;
	glitch: number;
	glitchIn: number;
	glitchSeed: number;
	flow: number;
	flowSpeed: number;
	flowAngle: number;
}

interface Spark {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	lifeSpeed: number;
}

interface ForgedHeadingProps {
	as?: "h1" | "h2";
	className?: string;
	/** Plain text. The letters are measured one by one. */
	children: ReactNode;
}

function setMask(el: HTMLElement, value: string | null) {
	for (const prefix of ["-webkit-mask-image", "mask-image"]) {
		if (value === null) el.style.removeProperty(prefix);
		else el.style.setProperty(prefix, value);
	}
}

export default function ForgedHeading({ as: Tag = "h2", className, children }: ForgedHeadingProps) {
	const wrapRef = useRef<HTMLDivElement>(null);
	const headingRef = useRef<HTMLHeadingElement>(null);
	const [forging, setForging] = useState(false);

	const reveal = useCallback(() => {
		const el = headingRef.current;
		if (!el) return;
		setMask(el, null);
		el.style.removeProperty("--forge");
		el.classList.remove("forge-pending");
	}, []);

	const finish = useCallback(() => {
		reveal();
		setForging(false);
	}, [reveal]);

	useEffect(() => {
		const el = headingRef.current;
		if (!el || prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;

		const id = playId(`forge-${el.textContent ?? ""}`);
		if (hasPlayed(id)) return;

		/*
			On a return visit the page is drawn finished before this runs, Reveal
			included. A heading already on screen has been seen whole, and masking
			it now would take the letters away and bring them back, so it counts
			as forged.
		*/
		if (isRevisit()) {
			const box = el.getBoundingClientRect();
			if (box.bottom > 0 && box.top < window.innerHeight) {
				markPlayed(id);
				return;
			}
		}

		/*
			Hidden before it can ever be seen. On a first visit every heading this
			is used on sits inside a Reveal, which keeps it transparent until it
			scrolls into view. On a return visit it is off screen, by the test
			above. Either way arming here never shows the letters and then takes
			them away again.
		*/
		el.style.setProperty("--forge", "0px");
		setMask(el, `linear-gradient(90deg, #000 calc(var(--forge) - ${SEAM}px), transparent var(--forge))`);
		el.classList.add("forge-pending");

		let startTimer = 0;
		let safetyTimer = 0;

		const observer = new IntersectionObserver((entries) => {
			if (!entries.some((entry) => entry.isIntersecting)) return;
			observer.disconnect();
			markPlayed(id);
			startTimer = window.setTimeout(() => setForging(true), START_DELAY_MS);
			safetyTimer = window.setTimeout(reveal, START_DELAY_MS + SAFETY_MS);
		}, { threshold: 0.5 });
		observer.observe(el);

		return () => {
			observer.disconnect();
			window.clearTimeout(startTimer);
			window.clearTimeout(safetyTimer);
			reveal();
		};
	}, [reveal]);

	return (
		<div ref={wrapRef} className="relative">
			<Tag ref={headingRef} className={className ? `${className} forge-heading` : "forge-heading"}>
				{children}
			</Tag>
			{forging && <ForgeSweep wrapRef={wrapRef} headingRef={headingRef} onDone={finish} />}
		</div>
	);
}

interface ForgeSweepProps {
	wrapRef: RefObject<HTMLDivElement | null>;
	headingRef: RefObject<HTMLHeadingElement | null>;
	onDone: () => void;
}

function ForgeSweep({ wrapRef, headingRef, onDone }: ForgeSweepProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Held in a ref so a new callback from the parent never restarts the sweep.
	const doneRef = useRef(onDone);
	useEffect(() => { doneRef.current = onDone; }, [onDone]);

	useEffect(() => {
		const canvas = canvasRef.current;
		const wrap = wrapRef.current;
		const heading = headingRef.current;
		if (!canvas || !wrap || !heading) return;

		const context = canvas.getContext("2d");
		if (!context) {
			doneRef.current();
			return;
		}
		// Annotated rather than narrowed, for the hoisted draw helpers below.
		const ctx: CanvasRenderingContext2D = context;
		const cv: HTMLCanvasElement = canvas;
		const el: HTMLHeadingElement = heading;

		const range = document.createRange();
		range.selectNodeContents(el);
		const text = range.getBoundingClientRect();
		const wrapBox = wrap.getBoundingClientRect();
		const headBox = el.getBoundingClientRect();
		if (text.width === 0 || text.height === 0) {
			doneRef.current();
			return;
		}

		/*
			Kept inside the viewport. On a phone the heading starts 16px from the
			screen edge, and a canvas reaching past it would push the page sideways.
		*/
		const viewport = document.documentElement.clientWidth;
		const padLeft = Math.max(0, Math.min(PAD, text.left));
		const padRight = Math.max(0, Math.min(PAD, viewport - text.right));

		const W = text.width + padLeft + padRight;
		const H = text.height + PAD * 2;
		const originX = text.left - padLeft;   // viewport x of the canvas' left edge
		const originY = text.top - PAD;
		cv.style.left = `${originX - wrapBox.left}px`;
		cv.style.top = `${originY - wrapBox.top}px`;
		const dpr = fitCanvas(cv, ctx, W, H);

		const fontSize = parseFloat(getComputedStyle(el).fontSize) || 30;
		const size = Math.round(fontSize * 0.8);
		const midY = text.top + text.height / 2 - originY;

		/*
			One glyph per visible letter, measured where the browser actually put
			it, so each 0 or 1 sits on the letter it turns into, wrapped lines
			and all. Spaces get nothing.
		*/
		const glyphs: Glyph[] = [];
		const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
		for (let node = walker.nextNode(); node; node = walker.nextNode()) {
			const value = node.nodeValue ?? "";
			for (let i = 0; i < value.length; i++) {
				if (/\s/.test(value[i])) continue;
				const letter = document.createRange();
				letter.setStart(node, i);
				letter.setEnd(node, i + 1);
				const r = letter.getBoundingClientRect();
				if (r.width === 0) continue;
				glyphs.push({
					x: r.left + r.width / 2 - originX,
					y: r.top + r.height / 2 - originY,
					char: Math.random() > 0.5 ? "1" : "0",
					flipIn: 2 + Math.floor(Math.random() * 8),
					glitch: 0,
					glitchIn: 6 + Math.floor(Math.random() * 40),
					glitchSeed: Math.floor(Math.random() * 100000),
					flow: Math.random(),
					flowSpeed: 0.014 + Math.random() * 0.014,
					flowAngle: (Math.random() - 0.5) * 1.2,
				});
			}
		}

		const sweepMs = Math.min(MAX_SWEEP_MS, Math.max(MIN_SWEEP_MS, glyphs.length * PER_CHAR_MS));
		const fromX = padLeft - 6;                   // canvas space, just before the first letter
		const toX = padLeft + text.width + SEAM + 6;  // just past the last one
		const headLeft = headBox.left - originX; // the mask is measured from the heading's box

		const blobs = FLAME_RGB.map(makeBlob);
		const sparks: Spark[] = [];

		function blob(sprite: HTMLCanvasElement, x: number, y: number, rx: number, ry: number, alpha: number) {
			ctx.globalAlpha = alpha;
			ctx.drawImage(sprite, x - rx, y - ry, rx * 2, ry * 2);
		}

		function drawGlyphs(step: number, seam: number, appear: number) {
			for (const g of glyphs) {
				const behind = seam - g.x;

				// Forged already. The letter is showing, still hot for a moment.
				if (behind > SEAM * 0.5) {
					if (behind < 70) {
						const heat = 1 - behind / 70;
						ctx.globalCompositeOperation = "lighter";
						blob(blobs[1], g.x, g.y, size * 1.2, size * 0.95, heat * 0.28);
						blob(blobs[0], g.x, g.y, size * 0.7, size * 0.55, heat * 0.34);
					}
					continue;
				}

				g.flipIn -= step;
				if (g.flipIn <= 0) {
					g.char = Math.random() > 0.5 ? "1" : "0";
					g.flipIn = 2 + Math.floor(Math.random() * 8);
				}

				g.glitchIn -= step;
				if (g.glitchIn <= 0) {
					g.glitch = 0.5 + Math.random() * 0.5;
					g.glitchSeed = Math.floor(Math.random() * 100000);
					g.glitchIn = 14 + Math.floor(Math.random() * 50);
				} else if (g.glitch > 0) {
					g.glitch = Math.max(0, g.glitch - 0.09 * step);
				}

				g.flow += g.flowSpeed * step;

				// Thinning out as the seam arrives, so the digit hands over to the letter.
				const nearing = Math.min(1, Math.max(0, (g.x - seam + SEAM) / (SEAM * 1.5)));
				const alpha = appear * (0.35 + nearing * 0.65);
				drawGlyph(ctx, g.char, g.x, g.y, size, alpha, {
					fill: bitGradient(ctx, g.x, g.y, size, g.flowAngle, g.flow, alpha),
					glow: bitMix(g.flow + 0.25),
				}, g.glitch, g.glitchSeed);
			}
		}

		function drawSeam(seam: number, now: number) {
			if (seam < padLeft - 4 || seam > padLeft + text.width + 4) return;
			const flick = 0.75 + 0.25 * Math.sin(now * 0.05);
			ctx.globalCompositeOperation = "lighter";
			blob(blobs[2], seam, midY, 12, text.height * 0.7, 0.45 * flick);
			blob(blobs[1], seam, midY, 6, text.height * 0.6, 0.7 * flick);
			blob(blobs[0], seam, midY, 2.5, text.height * 0.52, 0.95 * flick);

			if (sparks.length < MAX_SPARKS && Math.random() < 0.6) {
				sparks.push({
					x: seam,
					y: midY + (Math.random() - 0.5) * text.height * 0.8,
					vx: 0.6 + Math.random() * 1.8,
					vy: -(0.8 + Math.random() * 2.2),
					life: 0,
					lifeSpeed: 0.04 + Math.random() * 0.04,
				});
			}
		}

		function drawSparks(step: number) {
			ctx.globalCompositeOperation = "lighter";
			for (let i = sparks.length - 1; i >= 0; i--) {
				const s = sparks[i];
				s.life += s.lifeSpeed * step;
				if (s.life >= 1) { sparks.splice(i, 1); continue; }
				s.x += s.vx * step;
				s.y += s.vy * step;
				s.vy += 0.12 * step;
				blob(blobs[1], s.x, s.y, 3, 3, (1 - s.life) * 0.8);
			}
		}

		let raf = 0;
		let start = 0;
		let last = 0;

		function frame(now: number) {
			if (start === 0) start = now;
			const step = last === 0 ? 1 : Math.min((now - last) / 16.67, 3);
			last = now;
			const t = now - start;

			const p = Math.min(1, Math.max(0, (t - HOLD_MS) / sweepMs));
			const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
			const seam = fromX + (toX - fromX) * eased;
			// Never below where arming left it, so the mask only ever opens.
			el.style.setProperty("--forge", `${Math.max(0, seam - headLeft).toFixed(1)}px`);

			clearCanvas(cv, ctx, dpr);
			drawGlyphs(step, seam, Math.min(1, t / 160));
			drawSeam(seam, now);
			drawSparks(step);
			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = "source-over";

			if (t >= HOLD_MS + sweepMs + TAIL_MS) {
				doneRef.current();
				return;
			}
			raf = requestAnimationFrame(frame);
		}

		raf = requestAnimationFrame(frame);
		return () => cancelAnimationFrame(raf);
	}, [wrapRef, headingRef]);

	return (
		<canvas
			ref={canvasRef}
			aria-hidden="true"
			className="pointer-events-none absolute z-10"
			style={{ display: "block" }}
		/>
	);
}
