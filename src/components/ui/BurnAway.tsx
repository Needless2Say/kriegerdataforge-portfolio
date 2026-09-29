"use client";

import { useEffect, useRef, type RefObject } from "react";

import { bitGradient, bitMix, drawGlyph } from "@/utils/binaryGlyph";
import { FLAME_RGB, makeBlob } from "@/utils/blobSprite";

/*
	An element catching fire and burning away.

	Two halves have to agree with each other. The element itself is removed by a
	CSS mask, and the fire it gives off is drawn on a canvas laid over the
	element rather than inside it, because anything inside would be cut away by
	the same mask that is eating the element.

	The burn front runs bottom to top. It is cut into columns, each with a fixed
	offset of its own, so the edge tears rather than sweeping as a ruled line.
	The mask and the canvas read the same offsets, which is what keeps the
	flames sitting on the edge the mask is actually cutting.

	What comes off it is the site's own vocabulary. Forge coloured flame and
	embers, and 0s and 1s in the blue to purple blend, glitching as they rise,
	drawn by the same `binaryGlyph` renderer the loader and the page background
	use so all three cannot drift apart.
*/

/** Strips the burn front is cut into. More strips, finer tear. */
const COLUMNS = 12;

/** How soft the mask edge is, in pixels. */
const EDGE = 26;

/** How far a column may run ahead of or behind the front, in pixels. */
const JITTER = 15;

/**
 * Progress at which the element is fully consumed.
 *
 * The rest of the run is the fire dying down. Ending both at once snaps the
 * flame off mid lick, which reads as a dropped frame rather than as a finish.
 */
const FRONT_END = 0.72;

/* The canvas reaches well past the element, because the fire leaves it. */
const PAD_X      = 56;
const PAD_TOP    = 156;
const PAD_BOTTOM = 36;

const MAX_FLAMES = 68;
const MAX_BITS   = 34;
const MAX_EMBERS = 46;

/** Blobs per tongue. Five reads as one lick, more is wasted. */
const STACK = 5;

/** Height of the charred band above the front, in pixels. */
const SCORCH = 30;

interface Flame {
	x: number;
	y: number;
	r: number;      // width of the base
	len: number;    // how far the tongue reaches above its base
	vy: number;
	sway: number;
	phase: number;
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
	flipIn: number;     // frames until the next 0/1 flip
	glitch: number;     // 0 clean, up to 1 fully broken up, decays after a burst
	glitchIn: number;   // frames until the next burst
	glitchSeed: number; // fixes the tear pattern, re-rolled during a burst
	flow: number;       // where the blue/purple blend sits on the glyph
	flowSpeed: number;
	flowAngle: number;
}

interface Ember {
	x: number;
	y: number;
	vy: number;
	vx: number;
	size: number;
	phase: number;
	life: number;
	lifeSpeed: number;
}

interface BurnAwayProps {
	/** The element to consume. The mask goes on this, the canvas sits over it. */
	targetRef: RefObject<HTMLElement | null>;
	/** How long the whole thing takes, in milliseconds. */
	duration: number;
	/** Called once, after the last ember has gone. */
	onDone: () => void;
}

export default function BurnAway({ targetRef, duration, onDone }: BurnAwayProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	/*
		Held in a ref rather than read from the closure. The caller rebuilds this
		callback on every render, and in the dependency array it would tear the
		burn down and restart it from nothing partway through.
	*/
	const doneRef = useRef(onDone);
	useEffect(() => { doneRef.current = onDone; }, [onDone]);

	useEffect(() => {
		const canvas = canvasRef.current;
		const target = targetRef.current;
		if (!canvas || !target) return;

		const context = canvas.getContext("2d");
		if (!context) return;
		/*
			Annotated rather than narrowed, all three of them. TypeScript drops a
			narrowing inside hoisted function declarations and inside the cleanup
			closure, and every draw helper below is one of those.
		*/
		const ctx: CanvasRenderingContext2D = context;
		const cv: HTMLCanvasElement = canvas;
		const el: HTMLElement = target;

		const W = el.offsetWidth;
		const H = el.offsetHeight;
		if (W === 0 || H === 0) {
			doneRef.current();
			return;
		}

		const CW = W + PAD_X * 2;
		const CH = H + PAD_TOP + PAD_BOTTOM;

		cv.style.left = `${-PAD_X}px`;
		cv.style.top = `${-PAD_TOP}px`;
		cv.style.width = `${CW}px`;
		cv.style.height = `${CH}px`;

		/*
			Same cap as the other canvases on the site. Dropping it to 1.5 was
			tried and measured no cheaper, and the digits are real text, so the
			only thing a lower cap actually bought was softer glyphs.
		*/
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		cv.width = Math.round(CW * dpr);
		cv.height = Math.round(CH * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		const blobs = FLAME_RGB.map(makeBlob);
		const flames: Flame[] = [];
		const bits: Bit[] = [];
		const embers: Ember[] = [];

		const offsets: number[] = [];
		for (let i = 0; i < COLUMNS; i++) offsets.push((Math.random() * 2 - 1) * JITTER);

		/*
			One mask layer per column, each confined to its own vertical strip and
			each reading the same `--burn` with its own offset added. Layers union
			by default, so the strips reassemble into one torn front, and a frame
			only has to write one custom property rather than rebuild the mask.
		*/
		const layer = (offset: number) =>
			`linear-gradient(to top, rgba(0,0,0,0) calc(var(--burn) + ${offset.toFixed(1)}px),` +
			` rgba(0,0,0,1) calc(var(--burn) + ${(offset + EDGE).toFixed(1)}px))`;

		const maskImage = offsets.map(layer).join(", ");
		const maskSize = offsets.map(() => `${(100 / COLUMNS).toFixed(4)}% 100%`).join(", ");
		const maskPosition = offsets
			.map((_, i) => `${((i / (COLUMNS - 1)) * 100).toFixed(4)}% 0`)
			.join(", ");
		const maskRepeat = offsets.map(() => "no-repeat").join(", ");

		for (const prefix of ["-webkit-mask", "mask"]) {
			el.style.setProperty(`${prefix}-image`, maskImage);
			el.style.setProperty(`${prefix}-size`, maskSize);
			el.style.setProperty(`${prefix}-position`, maskPosition);
			el.style.setProperty(`${prefix}-repeat`, maskRepeat);
		}
		el.style.setProperty("--burn", "0px");

		/** Canvas space y of the burn front at a canvas space x. */
		function frontY(cx: number, burnt: number): number {
			const u = ((cx - PAD_X) / W) * COLUMNS - 0.5;
			const i0 = Math.floor(u);
			const t = u - i0;
			const a = offsets[Math.max(0, Math.min(COLUMNS - 1, i0))];
			const b = offsets[Math.max(0, Math.min(COLUMNS - 1, i0 + 1))];
			const s = t * t * (3 - 2 * t);
			return PAD_TOP + H - (burnt + a + (b - a) * s);
		}

		function blob(sprite: HTMLCanvasElement, x: number, y: number, r: number, alpha: number) {
			ctx.globalAlpha = alpha;
			ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
		}

		/** The same sprite stretched, for anything wider than it is tall. */
		function oval(
			sprite: HTMLCanvasElement,
			x: number,
			y: number,
			rx: number,
			ry: number,
			alpha: number,
		) {
			ctx.globalAlpha = alpha;
			ctx.drawImage(sprite, x - rx, y - ry, rx * 2, ry * 2);
		}

		function spawnFlame(burnt: number) {
			if (flames.length >= MAX_FLAMES) return;
			const x = PAD_X + Math.random() * W;
			flames.push({
				x,
				y: frontY(x, burnt) + (Math.random() - 0.5) * 8,
				r: 8 + Math.random() * 12,
				len: 24 + Math.random() * 72,
				vy: -(0.9 + Math.random() * 1.7),
				sway: 0.5 + Math.random() * 1.1,
				phase: Math.random() * Math.PI * 2,
				life: 0,
				lifeSpeed: 0.021 + Math.random() * 0.019,
			});
		}

		function spawnBit(burnt: number) {
			if (bits.length >= MAX_BITS) return;
			const x = PAD_X + Math.random() * W;
			bits.push({
				x,
				y: frontY(x, burnt) - Math.random() * 10,
				vx: (Math.random() - 0.5) * 1.9,
				vy: -(1.4 + Math.random() * 2.3),
				char: Math.random() > 0.5 ? "1" : "0",
				// Large enough that the blend across the character is actually
				// visible. Below roughly 14px the ink is a couple of pixels wide
				// and any gradient on it reads as one flat colour.
				size: 14 + Math.floor(Math.random() * 11),
				life: 0,
				lifeSpeed: 0.013 + Math.random() * 0.011,
				flipIn: 4 + Math.floor(Math.random() * 14),
				glitch: 0,
				glitchIn: 8 + Math.floor(Math.random() * 46),
				glitchSeed: Math.floor(Math.random() * 100000),
				flow: Math.random(),
				flowSpeed: 0.011 + Math.random() * 0.015,
				// Mostly sideways, so the blend runs across the digit not up it.
				flowAngle: (Math.random() - 0.5) * 1.2,
			});
		}

		function spawnEmber(burnt: number) {
			if (embers.length >= MAX_EMBERS) return;
			const x = PAD_X + Math.random() * W;
			embers.push({
				x,
				y: frontY(x, burnt) + (Math.random() - 0.5) * 10,
				vy: -(0.5 + Math.random() * 1.2),
				vx: (Math.random() - 0.5) * 0.7,
				size: 1 + Math.random() * 1.9,
				phase: Math.random() * Math.PI * 2,
				life: 0,
				lifeSpeed: 0.012 + Math.random() * 0.012,
			});
		}

		/*
			The char band, the one thing drawn normally rather than additively.
			The canvas is over the element, so a dark band painted just above the
			front browns the paper before the mask takes it.
		*/
		function drawScorch(burnt: number, fade: number) {
			ctx.globalCompositeOperation = "source-over";
			ctx.globalAlpha = 1;

			const stripe = W / COLUMNS;
			for (let i = 0; i < COLUMNS; i++) {
				const fy = PAD_TOP + H - (burnt + offsets[i]);
				const top = Math.max(PAD_TOP, fy - SCORCH);
				const bottom = Math.min(PAD_TOP + H, fy);
				if (bottom <= top) continue;

				const grad = ctx.createLinearGradient(0, fy - SCORCH, 0, fy);
				grad.addColorStop(0, "rgba(24,10,2,0)");
				grad.addColorStop(0.55, `rgba(16,6,1,${0.6 * fade})`);
				grad.addColorStop(1, `rgba(42,13,2,${0.95 * fade})`);
				ctx.fillStyle = grad;
				// A pixel of overlap, so the strips do not leave seams between them.
				ctx.fillRect(PAD_X + i * stripe, top, stripe + 1, bottom - top);
			}
		}

		/** The hot edge itself, glowing where the element is being eaten. */
		function drawFront(now: number, burnt: number, heat: number) {
			ctx.globalCompositeOperation = "lighter";
			const stripe = W / COLUMNS;

			for (let i = 0; i < COLUMNS; i++) {
				const fy = PAD_TOP + H - (burnt + offsets[i]);
				if (fy < PAD_TOP - EDGE || fy > PAD_TOP + H + 12) continue;

				const flick = 0.68 + 0.32 * Math.sin(now * 0.017 + i * 2.1);
				const cx = PAD_X + i * stripe + stripe / 2;
				/*
					Wide and flat. Drawn round, the sprite reads as a row of bubbles
					sitting on the card rather than as an edge that is alight.
				*/
				oval(blobs[2], cx, fy + 3, stripe * 1.05, 13, 0.34 * flick * heat);
				oval(blobs[1], cx, fy, stripe * 0.9, 8, 0.5 * flick * heat);
				oval(blobs[0], cx, fy - 1, stripe * 0.55, 4, 0.46 * flick * heat);
			}
		}

		function drawFlames(step: number, fade: number) {
			ctx.globalCompositeOperation = "lighter";
			for (let i = flames.length - 1; i >= 0; i--) {
				const f = flames[i];
				f.life += f.lifeSpeed * step;
				if (f.life >= 1) { flames.splice(i, 1); continue; }

				f.y += f.vy * step;
				f.phase += 0.09 * step;
				f.x += Math.sin(f.phase) * f.sway * step;

				/*
					A tongue, not a dot. Each one is a short stack that narrows and
					leans further the higher it goes, which is what makes a lick. One
					blob per particle only ever reads as a bubble however it is
					coloured, which is what this looked like before.
				*/
				const p = f.life;
				const grow = 0.75 + Math.sin(p * Math.PI) * 0.45;

				for (let k = 0; k < STACK; k++) {
					const q = k / (STACK - 1);            // 0 at the base, 1 at the tip
					const yy = f.y - f.len * grow * q;
					const xx = f.x + Math.sin(f.phase + q * 2.3) * f.sway * 7 * q;
					const rr = f.r * grow * (1 - q * 0.6);
					const sprite = q < 0.34 ? blobs[1] : q < 0.72 ? blobs[2] : blobs[3];
					blob(sprite, xx, yy, rr, (1 - p) * (1 - q * 0.42) * 0.25 * fade);
				}

				// The white hot foot of the tongue, only while it is young.
				if (p < 0.3) {
					blob(blobs[0], f.x, f.y, f.r * 0.5 * grow, (1 - p / 0.3) * 0.26 * fade);
				}
			}
		}

		function drawEmbers(step: number, fade: number) {
			ctx.globalCompositeOperation = "lighter";
			for (let i = embers.length - 1; i >= 0; i--) {
				const e = embers[i];
				e.life += e.lifeSpeed * step;
				if (e.life >= 1) { embers.splice(i, 1); continue; }

				e.y += e.vy * step;
				e.phase += 0.06 * step;
				e.x += (e.vx + Math.sin(e.phase) * 0.35) * step;

				const glow = e.life < 0.2 ? e.life / 0.2 : 1 - (e.life - 0.2) / 0.8;
				blob(blobs[1], e.x, e.y, e.size * 3, glow * 0.5 * fade);
			}
		}

		function drawBits(step: number, fade: number) {
			ctx.globalCompositeOperation = "lighter";
			/*
				blob() leaves globalAlpha set to whatever it last drew with, and it
				would multiply the glyphs below as well. Without this reset the
				digits come out at the alpha of the last flame drawn.
			*/
			ctx.globalAlpha = 1;

			for (let i = bits.length - 1; i >= 0; i--) {
				const b = bits[i];
				b.life += b.lifeSpeed * step;
				if (b.life >= 1) { bits.splice(i, 1); continue; }

				b.x += b.vx * step;
				b.y += b.vy * step;
				b.vy += 0.021 * step;   // just enough gravity to curl the rise over
				b.vx *= 0.993;

				b.flipIn -= step;
				if (b.flipIn <= 0) {
					b.char = Math.random() > 0.5 ? "1" : "0";
					b.flipIn = 4 + Math.floor(Math.random() * 14);
				}

				/*
					Bursts fire on a timer and then decay, so a digit is clean most of
					the time and breaks up for a fraction of a second at a go. The seed
					is re-rolled a few times mid burst so the tear moves, but not every
					frame, which would only look like noise.
				*/
				b.glitchIn -= step;
				if (b.glitchIn <= 0) {
					b.glitch = 0.55 + Math.random() * 0.45;
					b.glitchSeed = Math.floor(Math.random() * 100000);
					b.glitchIn = 10 + Math.floor(Math.random() * 52);
					b.char = Math.random() > 0.5 ? "1" : "0";
				} else if (b.glitch > 0) {
					b.glitch = Math.max(0, b.glitch - 0.085 * step);
					if (Math.random() < 0.22 * step) b.glitchSeed = Math.floor(Math.random() * 100000);
				}

				b.flow += b.flowSpeed * step;

				const alpha = Math.max(0, 1 - b.life * b.life) * fade;
				drawGlyph(ctx, b.char, b.x, b.y, b.size, alpha, {
					fill: bitGradient(ctx, b.x, b.y, b.size, b.flowAngle, b.flow, alpha),
					glow: bitMix(b.flow + 0.25),
				}, b.glitch, b.glitchSeed);
			}
		}

		let raf = 0;
		let start = 0;
		let last = 0;
		let finished = false;

		function frame(now: number) {
			if (start === 0) start = now;
			// Normalised against 60fps, so the burn does not run at double speed
			// on a 120Hz screen.
			const step = last === 0 ? 1 : Math.min((now - last) / 16.67, 3);
			last = now;

			const progress = Math.min(1, (now - start) / duration);

			// Slow to catch, then quick, the way paper goes.
			const front = Math.min(1, progress / FRONT_END);
			const burnt = Math.pow(front, 1.45) * (H + EDGE + JITTER);
			el.style.setProperty("--burn", `${burnt.toFixed(1)}px`);

			// Flame builds over the first moments and dies once the element is gone.
			const tail = progress <= FRONT_END ? 1 : Math.max(0, 1 - (progress - FRONT_END) / (1 - FRONT_END));
			const heat = Math.min(1, progress / 0.1) * tail;
			const density = Math.min(1.35, W / 300);

			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, cv.width, cv.height);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			if (heat > 0.02) {
				const wanted = 1.5 * step * density * heat;
				for (let i = 0; i < Math.floor(wanted); i++) spawnFlame(burnt);
				if (Math.random() < wanted % 1) spawnFlame(burnt);

				if (Math.random() < 0.62 * step * density * heat) spawnBit(burnt);
				if (Math.random() < 1.05 * step * density * heat) spawnEmber(burnt);
			}

			if (progress < FRONT_END) drawScorch(burnt, tail);
			drawFront(now, burnt, heat);
			drawFlames(step, tail);
			drawEmbers(step, tail);
			drawBits(step, tail);

			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = "source-over";

			if (progress >= 1) {
				if (!finished) {
					finished = true;
					doneRef.current();
				}
				return;
			}
			raf = requestAnimationFrame(frame);
		}

		raf = requestAnimationFrame(frame);

		return () => {
			cancelAnimationFrame(raf);
			for (const prefix of ["-webkit-mask", "mask"]) {
				el.style.removeProperty(`${prefix}-image`);
				el.style.removeProperty(`${prefix}-size`);
				el.style.removeProperty(`${prefix}-position`);
				el.style.removeProperty(`${prefix}-repeat`);
			}
			el.style.removeProperty("--burn");
		};
	}, [duration, targetRef]);

	return (
		<canvas
			ref={canvasRef}
			aria-hidden="true"
			className="pointer-events-none absolute z-10"
			style={{ display: "block" }}
		/>
	);
}
