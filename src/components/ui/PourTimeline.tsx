"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { bitGradient, bitMix, drawGlyph } from "@/utils/binaryGlyph";
import { FLAME_RGB, SPARK_RGB, clearCanvas, fitCanvas, makeBlob, prefersReducedMotion } from "@/utils/blobSprite";
import { hasPlayed, markPlayed, playId } from "@/utils/playOnce";

/*
	The About timeline as a pour of molten metal.

	The channel down the side fills as the page is read and drains again as it
	is scrolled back up, with a white hot drop at the leading edge. Each marker
	lights as the metal reaches it and goes cold again once the metal drains
	back above it.

	The first time the metal reaches a marker in a tab, it lands like a hammer
	on an anvil. A flash and a ring of light, sparks and bits thrown off, and
	the marker punching out white hot before it cools to its glow. That happens
	once per marker per tab. After it the marker only lights and cools as the
	metal comes and goes, so scrolling back and forth never repeats a blow.
	playOnce.ts has the rule.

	The metal flows rather than jumps. It chases the reading line with a short
	lag and a top speed, so a flick of the wheel pours visibly down the channel
	instead of arriving all at once, and a blow lands when the metal gets
	there rather than when the scroll does.

	Markers are found by `data-pour-dot`, so the page keeps its own markup and
	only tags the dots. The fill and the drop move by transform, and the loop
	stops as soon as the metal comes to rest.
*/

/** Where on screen the pour follows, as a share of the viewport height. */
const READING_LINE = 0.62;

/** Matches the track's `top-2` and `bottom-2`. */
const TRACK_INSET = 8;

/*
	How the metal moves. It closes the gap to the reading line with this time
	constant, but never faster than MAX_FLOW or slower than MIN_FLOW, both in
	pixels a second. The floor is what lets it settle rather than creep.
*/
const FLOW_TAU_MS = 130;
const MAX_FLOW    = 2000;
const MIN_FLOW    = 70;

/**
 * How far the metal has to drain back above a marker before it goes cold.
 * Without it, metal resting right on a marker could flicker it on and off.
 */
const COOL_GAP = 6;

/* The blow. How far its canvas reaches around the marker, and how long it runs. */
const STRIKE_REACH_X    = 150;
const STRIKE_REACH_UP   = 150;
const STRIKE_REACH_DOWN = 110;
const STRIKE_MS         = 1050;
const STRIKE_SPARKS     = 26;
const STRIKE_BITS       = 6;

interface Spark {
	x: number;
	y: number;
	vx: number;
	vy: number;
	rgb: string;
	life: number;
	lifeSpeed: number;
}

interface Bit {
	x: number;
	y: number;
	vx: number;
	vy: number;
	char: string;
	size: number;
	life: number;
	lifeSpeed: number;
	flipIn: number;
	glitch: number;
	glitchIn: number;
	glitchSeed: number;
	flow: number;
	flowSpeed: number;
	flowAngle: number;
}

/**
 * An element's distance from the top of an ancestor, ignoring transforms.
 *
 * Args:
 *     el: The element to measure.
 *     root: A positioned ancestor of it.
 *
 * Returns:
 *     Pixels from the top of `root` to the top of `el`.
 *
 * Offsets rather than bounding boxes, because every marker sits inside a
 * Reveal that slides up as it appears, and a bounding box measured mid slide
 * would light the marker late.
 */
function offsetWithin(el: HTMLElement, root: HTMLElement): number {
	let y = 0;
	let node: HTMLElement | null = el;
	while (node && node !== root) {
		y += node.offsetTop;
		node = node.offsetParent as HTMLElement | null;
	}
	return y;
}

/**
 * A hammer blow on one marker, on a canvas of its own that removes itself.
 *
 * Args:
 *     layer: The overlay the canvas goes in, covering the timeline exactly.
 *     dot: The marker being struck.
 *     blobs: Glow sprites, hottest first, shared by every blow on the page.
 *
 * Returns:
 *     A function that ends the blow early and cleans up. Safe to call twice.
 *
 * The marker's own punch and cooling is CSS, switched on by `data-struck`.
 * This draws everything around it.
 */
function strike(layer: HTMLElement, dot: HTMLElement, blobs: HTMLCanvasElement[]): () => void {
	dot.setAttribute("data-struck", "");

	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");
	let raf = 0;
	let ended = false;

	function end() {
		if (ended) return;
		ended = true;
		cancelAnimationFrame(raf);
		canvas.remove();
		dot.removeAttribute("data-struck");
	}

	if (!context) {
		// No sparks without a canvas, but the marker still takes the blow.
		const timer = window.setTimeout(end, STRIKE_MS);
		return () => {
			window.clearTimeout(timer);
			end();
		};
	}
	// Annotated rather than narrowed, for the hoisted draw helpers below.
	const ctx: CanvasRenderingContext2D = context;

	const layerBox = layer.getBoundingClientRect();
	const dotBox = dot.getBoundingClientRect();
	const x = dotBox.left + dotBox.width / 2;
	const y = dotBox.top + dotBox.height / 2;

	/*
		Kept inside the viewport across. The markers sit near the left edge, and
		on a phone most of a centred canvas would be drawing off screen.
	*/
	const viewport = document.documentElement.clientWidth;
	const padLeft = Math.max(0, Math.min(STRIKE_REACH_X, x));
	const padRight = Math.max(0, Math.min(STRIKE_REACH_X, viewport - x));

	canvas.setAttribute("aria-hidden", "true");
	canvas.style.position = "absolute";
	canvas.style.display = "block";
	canvas.style.left = `${x - padLeft - layerBox.left}px`;
	canvas.style.top = `${y - STRIKE_REACH_UP - layerBox.top}px`;
	layer.appendChild(canvas);
	const dpr = fitCanvas(canvas, ctx, padLeft + padRight, STRIKE_REACH_UP + STRIKE_REACH_DOWN);

	// The marker's centre, in canvas space.
	const cx = padLeft;
	const cy = STRIKE_REACH_UP;

	const sparks: Spark[] = [];
	const bits: Bit[] = [];

	function spawnSparks(count: number, power: number) {
		for (let i = 0; i < count; i++) {
			// Mostly up and out, a few skimming sideways off the anvil.
			const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
			const speed = (2.4 + Math.random() * 3.8) * power;
			sparks.push({
				x: cx + (Math.random() - 0.5) * 6,
				y: cy + (Math.random() - 0.5) * 4,
				vx: Math.cos(angle) * speed * 1.1,
				vy: Math.sin(angle) * speed,
				rgb: SPARK_RGB[Math.floor(Math.random() * SPARK_RGB.length)],
				life: 0,
				lifeSpeed: 0.026 + Math.random() * 0.026,
			});
		}
	}

	function spawnBits() {
		for (let i = 0; i < STRIKE_BITS; i++) {
			const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.85;
			const speed = 1.6 + Math.random() * 2.4;
			// Starting a little way out, so they never sit on top of the white flash.
			bits.push({
				x: cx + Math.cos(angle) * 11,
				y: cy + Math.sin(angle) * 11,
				vx: Math.cos(angle) * speed * 1.3,
				vy: Math.sin(angle) * speed,
				char: Math.random() > 0.5 ? "1" : "0",
				size: 11 + Math.floor(Math.random() * 4),
				life: 0,
				lifeSpeed: 0.016 + Math.random() * 0.01,
				flipIn: 4 + Math.floor(Math.random() * 12),
				glitch: 0.6,
				glitchIn: 10 + Math.floor(Math.random() * 40),
				glitchSeed: Math.floor(Math.random() * 100000),
				flow: Math.random(),
				flowSpeed: 0.012 + Math.random() * 0.014,
				flowAngle: (Math.random() - 0.5) * 1.2,
			});
		}
	}

	function blob(sprite: HTMLCanvasElement, bx: number, by: number, rx: number, ry: number, alpha: number) {
		ctx.globalAlpha = alpha;
		ctx.drawImage(sprite, bx - rx, by - ry, rx * 2, ry * 2);
	}

	/** The flash of the blow and the line of light along the anvil's face. */
	function drawFlash(t: number) {
		ctx.globalCompositeOperation = "lighter";
		if (t < 220) {
			const p = t / 220;
			const fade = (1 - p) * (1 - p);
			const grow = 0.7 + p * 0.6;
			blob(blobs[1], cx, cy, 34 * grow, 34 * grow, 0.6 * fade);
			blob(blobs[0], cx, cy, 15 * grow, 15 * grow, 0.95 * fade);
		}
		if (t < 300) {
			const p = t / 300;
			const spread = 0.5 + p * 0.8;
			blob(blobs[0], cx, cy, 36 * spread, 2.4, (1 - p) * 0.9);
			blob(blobs[1], cx, cy, 42 * spread, 7, (1 - p) * 0.45);
		}
	}

	/** Two rings rolling out from the blow, the second a beat behind and wider. */
	function drawRings(t: number) {
		ctx.globalCompositeOperation = "lighter";
		ctx.globalAlpha = 1;
		for (const [delay, span, reach] of [[0, 520, 1], [80, 620, 1.45]] as const) {
			const local = t - delay;
			if (local < 0 || local > span) continue;
			const p = local / span;
			const ease = 1 - Math.pow(1 - p, 3);
			const radius = 8 + 28 * ease * reach;
			const alpha = Math.pow(1 - p, 2);

			ctx.beginPath();
			ctx.arc(cx, cy, radius, 0, Math.PI * 2);
			ctx.strokeStyle = `rgba(249,115,22,${0.3 * alpha})`;
			ctx.lineWidth = 5 * (1 - p) + 1.5;
			ctx.stroke();
			ctx.strokeStyle = `rgba(255,236,179,${0.75 * alpha})`;
			ctx.lineWidth = 1.3 * (1 - p) + 0.5;
			ctx.stroke();
		}
	}

	function drawSparks(step: number, fade: number) {
		ctx.globalCompositeOperation = "lighter";
		ctx.lineCap = "round";
		const drag = Math.pow(0.985, step);
		for (let i = sparks.length - 1; i >= 0; i--) {
			const s = sparks[i];
			s.life += s.lifeSpeed * step;
			if (s.life >= 1) { sparks.splice(i, 1); continue; }

			s.x += s.vx * step;
			s.y += s.vy * step;
			s.vy += 0.21 * step;   // arcing back down is what makes them read as heavy
			s.vx *= drag;

			const alpha = (1 - s.life) * fade;
			ctx.globalAlpha = 1;
			ctx.strokeStyle = `rgba(${s.rgb},${alpha})`;
			ctx.lineWidth = 1.6;
			ctx.beginPath();
			ctx.moveTo(s.x, s.y);
			ctx.lineTo(s.x - s.vx * 2.5, s.y - s.vy * 2.5);
			ctx.stroke();
			blob(blobs[1], s.x, s.y, 3.5, 3.5, alpha * 0.7);
		}
	}

	function drawBits(step: number, fade: number, t: number) {
		const drag = Math.pow(0.99, step);
		// Faded in over the flash rather than born at full strength inside it.
		const appear = Math.min(1, t / 90);
		for (let i = bits.length - 1; i >= 0; i--) {
			const b = bits[i];
			b.life += b.lifeSpeed * step;
			if (b.life >= 1) { bits.splice(i, 1); continue; }

			b.x += b.vx * step;
			b.y += b.vy * step;
			b.vy += 0.07 * step;
			b.vx *= drag;

			b.flipIn -= step;
			if (b.flipIn <= 0) {
				b.char = Math.random() > 0.5 ? "1" : "0";
				b.flipIn = 4 + Math.floor(Math.random() * 12);
			}

			// Thrown off glitching, then bursting on a timer like every digit on the site.
			b.glitchIn -= step;
			if (b.glitchIn <= 0) {
				b.glitch = 0.55 + Math.random() * 0.45;
				b.glitchSeed = Math.floor(Math.random() * 100000);
				b.glitchIn = 12 + Math.floor(Math.random() * 50);
			} else if (b.glitch > 0) {
				b.glitch = Math.max(0, b.glitch - 0.085 * step);
			}

			b.flow += b.flowSpeed * step;

			const alpha = Math.max(0, 1 - b.life * b.life) * fade * appear;
			drawGlyph(ctx, b.char, b.x, b.y, b.size, alpha, {
				fill: bitGradient(ctx, b.x, b.y, b.size, b.flowAngle, b.flow, alpha),
				glow: bitMix(b.flow + 0.25),
			}, b.glitch, b.glitchSeed);
		}
	}

	let start = 0;
	let last = 0;
	let second = false;

	function frame(now: number) {
		if (start === 0) {
			start = now;
			spawnSparks(STRIKE_SPARKS, 1);
			spawnBits();
		}
		// Normalised against 60fps, so a 120Hz screen does not run it double speed.
		const step = last === 0 ? 1 : Math.min((now - last) / 16.67, 3);
		last = now;
		const t = now - start;

		// A smaller second shower, the metal ringing after the blow.
		if (!second && t > 60) {
			second = true;
			spawnSparks(Math.round(STRIKE_SPARKS * 0.4), 0.7);
		}

		const fade = t < STRIKE_MS - 250 ? 1 : Math.max(0, (STRIKE_MS - t) / 250);

		clearCanvas(canvas, ctx, dpr);
		drawFlash(t);
		drawRings(t);
		drawSparks(step, fade);
		drawBits(step, fade, t);
		ctx.globalAlpha = 1;
		ctx.globalCompositeOperation = "source-over";

		if (t >= STRIKE_MS) {
			end();
			return;
		}
		raf = requestAnimationFrame(frame);
	}

	raf = requestAnimationFrame(frame);
	return end;
}

export default function PourTimeline({ children }: { children: ReactNode }) {
	const rootRef = useRef<HTMLDivElement>(null);
	const fillRef = useRef<HTMLDivElement>(null);
	const headRef = useRef<HTMLDivElement>(null);
	const layerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const root = rootRef.current;
		const fill = fillRef.current;
		const head = headRef.current;
		const layer = layerRef.current;
		if (!root || !fill || !head || !layer) return;

		// Annotated rather than narrowed, for the hoisted helpers below.
		const box: HTMLDivElement = root;
		const metal: HTMLDivElement = fill;
		const drop: HTMLDivElement = head;
		const overlay: HTMLDivElement = layer;
		const dots = Array.from(box.querySelectorAll<HTMLElement>("[data-pour-dot]"));

		// Which markers have already taken their blow in this tab.
		const ids = dots.map((_, i) => playId(`pour-${i}`));
		const struck = ids.map(hasPlayed);
		const blows: Array<() => void> = [];
		let blobs: HTMLCanvasElement[] | null = null;

		let track = 0;
		let marks: number[] = [];
		let target = 0;
		let level = 0;
		let raf = 0;
		let last = 0;

		function measure() {
			track = Math.max(0, box.offsetHeight - TRACK_INSET * 2);
			marks = dots.map((dot) => offsetWithin(dot, box) + dot.offsetHeight / 2 - TRACK_INSET);
		}

		/** Where the metal is heading, the point the reading line crosses the track. */
		function aim() {
			const top = box.getBoundingClientRect().top + TRACK_INSET;
			target = Math.max(0, Math.min(track, window.innerHeight * READING_LINE - top));
		}

		/** The blow, if this marker has not had it yet and can be seen taking it. */
		function strikeOnce(dot: HTMLElement, i: number) {
			if (struck[i]) return;
			// Off screen the blow would be wasted, so it waits for the metal to come again.
			const seen = dot.getBoundingClientRect();
			if (seen.top < 0 || seen.bottom > window.innerHeight) return;
			struck[i] = true;
			markPlayed(ids[i]);
			blobs ??= FLAME_RGB.map(makeBlob);
			blows.push(strike(overlay, dot, blobs));
		}

		function render() {
			const ratio = track > 0 ? level / track : 0;
			metal.style.transform = `scaleY(${ratio.toFixed(4)})`;
			drop.style.transform = `translateY(${level.toFixed(1)}px)`;
			drop.style.opacity = level > 0.5 && level < track - 0.5 ? "1" : "0";
			dots.forEach((dot, i) => {
				const lit = dot.hasAttribute("data-lit");
				if (!lit && level >= marks[i]) {
					dot.setAttribute("data-lit", "");
					strikeOnce(dot, i);
				} else if (lit && level < marks[i] - COOL_GAP) {
					dot.removeAttribute("data-lit");
				}
			});
		}

		function frame(now: number) {
			raf = 0;
			aim();
			const dt = last === 0 ? 16.67 : Math.min(now - last, 64);
			const gap = target - level;
			const distance = Math.abs(gap);
			const pull = distance * (1 - Math.exp(-dt / FLOW_TAU_MS));
			const move = Math.min(Math.max(pull, (MIN_FLOW * dt) / 1000), (MAX_FLOW * dt) / 1000);
			level = move >= distance ? target : level + Math.sign(gap) * move;
			render();

			if (level === target) {
				last = 0;   // at rest, until the next scroll
				return;
			}
			last = now;
			raf = requestAnimationFrame(frame);
		}

		function schedule() {
			if (!raf) raf = requestAnimationFrame(frame);
		}

		measure();

		// Nothing to watch. The metal is already in and every marker lit, with no blows.
		if (prefersReducedMotion()) {
			struck.fill(true);
			level = track;
			render();
			return;
		}

		// Starts empty and pours down to wherever the reading line already is.
		schedule();

		const resize = new ResizeObserver(() => {
			measure();
			level = Math.min(level, track);
			schedule();
		});
		resize.observe(box);
		window.addEventListener("scroll", schedule, { passive: true });

		return () => {
			cancelAnimationFrame(raf);
			resize.disconnect();
			window.removeEventListener("scroll", schedule);
			blows.forEach((stop) => stop());
		};
	}, []);

	return (
		<div ref={rootRef} className="relative">
			<div aria-hidden="true" className="pour-track absolute left-3 top-2 bottom-2 w-px" />
			<div ref={fillRef} aria-hidden="true" className="pour-fill absolute top-2 bottom-2" />
			<div ref={headRef} aria-hidden="true" className="pour-head absolute" />
			{children}
			{/* The blows are drawn here, above the milestones, and each removes itself. */}
			<div ref={layerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20" />
		</div>
	);
}
