"use client";

import { useEffect, useRef } from "react";

import { bitGradient, bitMix, drawGlyph } from "@/utils/binaryGlyph";
import { FLAME_RGB, makeBlob, prefersReducedMotion } from "@/utils/blobSprite";

/*
	The forge fire that burns across the whole screen while the site loads.

	A bed of coals runs along the bottom edge and a wall of flame climbs off it,
	tallest in the middle. Sparks leave it the whole time, fire coloured ones
	and glitching 0s and 1s in blue and purple, so the idea reads both ways.
	Computer bits going into the fire, hot metal coming back out of it. Embers
	drift up through everything above.

	It catches rather than simply appearing. For the first moments only the
	coals glow, then the flames climb off them and the first big shower of
	sparks goes up as the fire takes.

	Two resolutions, because of the size. Everything soft, the coals, the flames
	and the heat over them, is drawn into a small buffer a third of the screen's
	size and stretched over the canvas in one draw. A flame is nothing but soft
	glows, so the stretch cannot be seen, and it is a ninth of the pixels to
	fill, or a thirty-sixth on a high density screen. Sparks and embers are
	small and sharp, so they are drawn on top at full resolution.
*/

interface Tongue {
	x: number;       // where it stands across the screen, CSS pixels
	width: number;   // radius at the base, CSS pixels
	reach: number;   // share of the flame height it climbs
	phase: number;
	speed: number;
	back: boolean;   // the row behind, taller and darker, with no white core
}

interface Coal {
	x: number;
	size: number;
	phase: number;
	speed: number;
}

interface Spark {
	x: number;
	y: number;
	vx: number;
	vy: number;
	lift: number;       // the steadier rise the heat settles it into
	char: string;
	size: number;
	rgb: string;
	isBit: boolean;
	life: number;       // 0 to 1
	lifeSpeed: number;
	flipIn: number;     // frames until the next 0/1 flip
	glitch: number;     // 0 clean, up to 1 fully broken up, decays after a burst
	glitchIn: number;   // frames until the next burst
	glitchSeed: number; // fixes the tear pattern, re-rolled during a burst
	flow: number;       // bit sparks only, where the blue/purple blend sits
	flowSpeed: number;  // how fast the blend travels across the glyph
	flowAngle: number;  // which way it travels
}

interface Ember {
	x: number;
	y: number;
	vy: number;
	phase: number;
	size: number;
	life: number;
	lifeSpeed: number;
}

const SPARK_FIRE = ["245,158,11", "251,146,60", "239,68,68"];

/** The loader's background, painted into the canvas so the canvas can be opaque. */
const BACKGROUND = "#0a0704";

/** The soft layer's size, as a share of the screen's. */
const SOFT_SCALE = 1 / 3;

/** From glowing coals to a fire at full height. */
const IGNITE_MS = 700;

/** Roughly how far apart the flame tongues and the coals stand, in CSS pixels. */
const TONGUE_SPACING = 120;
const COAL_SPACING   = 30;

/** Glows stacked up each tongue, coals to tip. */
const STEPS = 20;

/*
	Each glow in a tongue is this much taller than it is wide. Flames are, and it
	runs each glow into the next. Round ones read as a string of beads.
*/
const STRETCH = 1.7;

/** Spark and ember numbers are tuned at this width and scale from it. */
const REFERENCE_WIDTH = 1280;

const TAU = Math.PI * 2;

/**
 * A repeatable 0 to 1 from an index.
 *
 * Args:
 *     n: The index of a tongue or coal, offset per property.
 *
 * Returns:
 *     A value in [0, 1).
 *
 * The tongues and coals are rebuilt whenever the screen changes size, which a
 * phone does every time its address bar slides. Taking their shapes from their
 * index rather than from Math.random keeps it the same fire through a resize.
 */
function seeded(n: number): number {
	const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return s - Math.floor(s);
}

/**
 * How tall the fire stands at a point across the screen.
 *
 * Args:
 *     across: -1 at the left edge, 0 in the middle, 1 at the right edge.
 *
 * Returns:
 *     A share of the full flame height, 1 in the middle and lower toward the
 *     edges, so the wall of fire has a centre rather than a flat top.
 */
function shape(across: number): number {
	const a = Math.max(-1, Math.min(1, across));
	return 0.72 + 0.28 * (1 - a * a);
}

export default function ForgeFire() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		// Opaque, with the background painted in, so nothing has to blend underneath it.
		const context = canvas.getContext("2d", { alpha: false });
		const soft = document.createElement("canvas");
		const softContext = soft.getContext("2d");
		if (!context || !softContext) return;
		// Annotated rather than narrowed. TypeScript drops a narrowing inside
		// hoisted function declarations, and every draw helper below is one.
		const ctx: CanvasRenderingContext2D = context;
		const sctx: CanvasRenderingContext2D = softContext;
		const cv: HTMLCanvasElement = canvas;

		const blobs = FLAME_RGB.map(makeBlob);
		const tongues: Tongue[] = [];
		const coals: Coal[] = [];
		const sparks: Spark[] = [];
		const embers: Ember[] = [];
		const reduced = prefersReducedMotion();

		let W = 0, H = 0, dpr = 1;
		let baseY = 0, flameH = 0;
		let rise = 1;         // spark and ember speeds follow the screen's height
		let glyphScale = 1;   // digits a little larger on a large screen
		let widthShare = 1;   // how many sparks, against the reference width
		let maxSparks = 0;
		let heat: CanvasGradient | null = null;
		let raf = 0;
		let start = 0;
		let last = 0;
		let nextBurst = 0;
		let spawnDue = 0;
		let caught = false;

		function newEmber(anywhere: boolean): Ember {
			return {
				x: Math.random() * W,
				// On the first frame they are already all the way up the screen,
				// after that they rise out of the fire.
				y: anywhere ? Math.random() * H : baseY - Math.random() * flameH * 0.5,
				vy: -(0.35 + Math.random() * 0.9) * rise,
				phase: Math.random() * TAU,
				size: 0.9 + Math.random() * 1.7,
				life: anywhere ? Math.random() * 0.7 : 0,
				lifeSpeed: 0.003 + Math.random() * 0.004,
			};
		}

		/**
		 * Fit everything to the canvas' current size.
		 *
		 * Returns:
		 *     `false` while the canvas has no size yet, in which case there is
		 *     nothing to draw.
		 */
		function layout(): boolean {
			W = cv.offsetWidth;
			H = cv.offsetHeight;
			if (W === 0 || H === 0) return false;

			// Capped at 2 like every other canvas on the site.
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			cv.width = Math.round(W * dpr);
			cv.height = Math.round(H * dpr);
			soft.width = Math.max(1, Math.ceil(W * SOFT_SCALE));
			soft.height = Math.max(1, Math.ceil(H * SOFT_SCALE));

			baseY = H + 12;
			flameH = H * 0.72;
			rise = Math.min(1.6, Math.max(0.8, H / 800));
			glyphScale = Math.min(1.3, Math.max(0.9, Math.min(W, H) / 760));
			widthShare = W / REFERENCE_WIDTH;
			// Enough to fill the screen, few enough that the fire stays the subject.
			maxSparks = Math.round(Math.min(160, Math.max(36, 100 * widthShare * rise)));

			/*
				Two rows of tongues across the full width. The front row is shorter
				and hotter, the row behind stands in its gaps, taller and darker.
				They overlap at the base, so the coals read as one bed of fire, but
				not higher up, where the dark between two tongues is what gives each
				one its shape.
			*/
			tongues.length = 0;
			const count = Math.max(4, Math.ceil(W / TONGUE_SPACING) + 1);
			const spacing = W / (count - 1);
			for (let i = 0; i < count; i++) {
				tongues.push({
					x: i * spacing + (seeded(i) - 0.5) * spacing * 0.35,
					width: spacing * (0.58 + seeded(i + 40) * 0.24),
					reach: 0.5 + seeded(i + 80) * 0.42,
					phase: seeded(i + 120) * TAU,
					speed: 0.003 + seeded(i + 160) * 0.0035,
					back: false,
				});
			}
			for (let i = 0; i < count - 1; i++) {
				tongues.push({
					x: (i + 0.5) * spacing + (seeded(i + 200) - 0.5) * spacing * 0.3,
					width: spacing * (0.62 + seeded(i + 240) * 0.24),
					reach: 0.78 + seeded(i + 280) * 0.3,
					phase: seeded(i + 320) * TAU,
					speed: 0.0024 + seeded(i + 360) * 0.003,
					back: true,
				});
			}

			coals.length = 0;
			const coalCount = Math.ceil(W / COAL_SPACING) + 2;
			for (let i = 0; i < coalCount; i++) {
				coals.push({
					x: (i - 0.5) * COAL_SPACING + (seeded(i + 400) - 0.5) * 14,
					size: 22 + seeded(i + 440) * 24,
					phase: seeded(i + 480) * TAU,
					speed: 0.0015 + seeded(i + 520) * 0.002,
				});
			}

			/*
				The heat the fire throws up the screen, strongest at the coals. Kept
				faint. Any stronger and it fills the gaps between the tongues, and
				the flames go back to being one flat glow.
			*/
			heat = sctx.createLinearGradient(0, H, 0, H - flameH * 1.05);
			heat.addColorStop(0, "rgba(234,88,12,0.26)");
			heat.addColorStop(0.4, "rgba(194,65,12,0.08)");
			heat.addColorStop(1, "rgba(127,29,29,0)");

			const emberCount = Math.round(Math.min(150, Math.max(36, (W * H) / 11000)));
			while (embers.length < emberCount) embers.push(newEmber(true));
			embers.length = emberCount;
			return true;
		}

		function spawnSpark(power: number) {
			if (sparks.length >= maxSparks) return;
			const x = Math.random() * W;
			sparks.push({
				x,
				// Up in the body of the flame, not down in the coals, so each one
				// is seen leaving the fire rather than lost inside it.
				y: baseY - flameH * shape((x - W / 2) / (W / 2)) * (0.15 + Math.random() * 0.5),
				vx: (Math.random() - 0.5) * 3 * power,
				vy: -(2.2 + Math.random() * 3.6 * power) * rise,
				lift: -(1 + Math.random() * 1.5) * rise,
				char: Math.random() > 0.5 ? "1" : "0",
				// Big enough that a gradient across the character is actually visible.
				size: Math.round((14 + Math.random() * 12) * glyphScale),
				// Unused on a bit spark, which paints itself from the travelling blend.
				rgb: SPARK_FIRE[Math.floor(Math.random() * SPARK_FIRE.length)],
				isBit: Math.random() < 0.45,
				life: 0,
				lifeSpeed: 0.0055 + Math.random() * 0.006,
				flipIn: 4 + Math.floor(Math.random() * 14),
				glitch: 0,
				glitchIn: 12 + Math.floor(Math.random() * 70),
				glitchSeed: Math.floor(Math.random() * 100000),
				flow: Math.random(),
				flowSpeed: 0.010 + Math.random() * 0.014,
				// Mostly sideways, so the blend runs across the digit rather than up it.
				flowAngle: (Math.random() - 0.5) * 1.2,
			});
		}

		function spawn(now: number, t: number, step: number, ignite: number) {
			// The fire takes, and throws its first big shower of sparks.
			if (!caught && t > IGNITE_MS * 0.45) {
				caught = true;
				const count = Math.round(8 + 20 * widthShare);
				for (let i = 0; i < count; i++) spawnSpark(1.8);
				nextBurst = now + 600;
			}

			// A steady stream, owed by the frame rather than rolled per frame, so
			// a wide screen that wants more than one a frame gets them.
			spawnDue += 0.5 * widthShare * ignite * step;
			while (spawnDue >= 1) {
				spawnSpark(1);
				spawnDue -= 1;
			}

			if (caught && now > nextBurst) {
				const count = Math.round((4 + Math.random() * 5) * widthShare) + 1;
				for (let i = 0; i < count; i++) spawnSpark(1.5);
				nextBurst = now + 600 + Math.random() * 800;
			}
		}

		function softOval(sprite: HTMLCanvasElement, x: number, y: number, rx: number, ry: number, alpha: number) {
			sctx.globalAlpha = alpha;
			sctx.drawImage(sprite, x - rx, y - ry, rx * 2, ry * 2);
		}

		function softBlob(sprite: HTMLCanvasElement, x: number, y: number, r: number, alpha: number) {
			softOval(sprite, x, y, r, r, alpha);
		}

		function blob(sprite: HTMLCanvasElement, x: number, y: number, r: number, alpha: number) {
			ctx.globalAlpha = alpha;
			ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
		}

		function drawCoals(now: number, ignite: number) {
			// Already glowing before the fire catches, since that is what it catches from.
			const glow = 0.45 + 0.55 * ignite;
			for (const c of coals) {
				const hot = 0.55 + 0.45 * Math.sin(now * c.speed + c.phase);
				softBlob(blobs[3], c.x, H + 4, c.size * (1.2 + hot * 0.5), (0.2 + hot * 0.14) * glow);
				softBlob(blobs[2], c.x, H + 2, c.size * (0.55 + hot * 0.35), (0.14 + hot * 0.18) * glow);
			}
		}

		function drawTongue(tg: Tongue, now: number, ignite: number) {
			// Two sine waves at unrelated rates, which is enough to stop the
			// flicker landing on an obvious beat.
			const flick =
				0.74 +
				0.26 * Math.sin(now * tg.speed + tg.phase) +
				0.12 * Math.sin(now * tg.speed * 2.7 + tg.phase * 1.9);
			const reach = flameH * tg.reach * Math.max(0.35, flick) * shape((tg.x - W / 2) / (W / 2)) * ignite;
			if (reach < 2) return;

			for (let i = 0; i < STEPS; i++) {
				const p = i / (STEPS - 1);          // 0 at the coals, 1 at the tip
				const y = baseY - reach * p;
				/*
					Sideways movement grows faster than height, so the base stays
					planted on the coals while the tips lick and curl.
				*/
				const lick = Math.pow(p, 1.4);
				const sway =
					Math.sin(now * 0.0027 + tg.phase + p * 3.4) * tg.width * 0.45 * lick +
					Math.sin(now * 0.0056 + tg.phase * 2.3 + p * 6.1) * tg.width * 0.2 * lick;
				const x = tg.x + sway;
				const r = tg.width * Math.pow(1 - p, 0.7) * (0.66 + 0.34 * flick);
				const ry = r * STRETCH;

				/*
					Even up the tongue, fading only near the tip. The glows overlap
					most at the base, where they are widest, so the base is already the
					brightest part. Fading them with height as well left every tongue a
					bright stub under a dim smear.
				*/
				const body = p < 0.75 ? 1 : 1 - (p - 0.75) / 0.25;

				// The row behind is orange into red and nothing hotter, which is what
				// sets it back, and fainter low down, where the front row covers it.
				if (tg.back) {
					softOval(p < 0.6 ? blobs[2] : blobs[3], x, y, r, ry, 0.075 * body * (0.5 + 0.5 * Math.min(1, p / 0.5)));
					continue;
				}

				// The body, orange into a red tip.
				softOval(p < 0.72 ? blobs[2] : blobs[3], x, y, r, ry, 0.1 * body);

				// A narrower, shorter heart of amber inside it, so a tongue burns
				// hotter at its middle than at its edges.
				if (p < 0.62) {
					softOval(blobs[1], x, y, r * 0.55, ry * 0.55, 0.15 * (1 - p / 0.62));
				}

				// And near white at the root, which is what gives the fire a hot
				// base instead of a flat wash.
				if (p < 0.22) {
					softOval(blobs[0], x, y, r * 0.32, ry * 0.32, 0.12 * (1 - p / 0.22));
				}
			}
		}

		function drawSoft(now: number, ignite: number) {
			sctx.setTransform(1, 0, 0, 1, 0, 0);
			sctx.globalCompositeOperation = "source-over";
			sctx.globalAlpha = 1;
			sctx.fillStyle = BACKGROUND;
			sctx.fillRect(0, 0, soft.width, soft.height);

			// Drawn in CSS pixels like everything else, the buffer's scale does the rest.
			sctx.setTransform(SOFT_SCALE, 0, 0, SOFT_SCALE, 0, 0);
			sctx.globalCompositeOperation = "lighter";

			if (heat) {
				const breathe = 0.8 + 0.13 * Math.sin(now * 0.0031) + 0.07 * Math.sin(now * 0.0077 + 1.3);
				sctx.globalAlpha = breathe * ignite;
				sctx.fillStyle = heat;
				sctx.fillRect(0, H - flameH * 1.3, W, flameH * 1.3);
			}

			drawCoals(now, ignite);
			for (const tg of tongues) drawTongue(tg, now, ignite);
			sctx.globalAlpha = 1;
		}

		/** The soft layer, stretched over the whole canvas. It replaces the last frame, so no clear is needed. */
		function stretchSoft() {
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.globalCompositeOperation = "copy";
			ctx.globalAlpha = 1;
			ctx.drawImage(soft, 0, 0, W * SOFT_SCALE, H * SOFT_SCALE, 0, 0, cv.width, cv.height);
			ctx.globalCompositeOperation = "source-over";
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		}

		function drawEmbers(step: number, ignite: number) {
			ctx.globalCompositeOperation = "lighter";
			const glow = 0.35 + 0.65 * ignite;
			for (let i = 0; i < embers.length; i++) {
				const e = embers[i];
				e.y += e.vy * step;
				e.phase += 0.05 * step;
				e.x += Math.sin(e.phase) * 0.4 * step;
				e.life += e.lifeSpeed * step;
				if (e.life >= 1 || e.y < -10) {
					embers[i] = newEmber(false);
					continue;
				}
				const fade = e.life < 0.15 ? e.life / 0.15 : 1 - (e.life - 0.15) / 0.85;
				blob(blobs[1], e.x, e.y, e.size * 3, fade * 0.5 * glow);
			}
		}

		function drawSparks(step: number) {
			ctx.globalCompositeOperation = "lighter";
			/*
				blob() leaves globalAlpha set to whatever it last drew with, and that
				multiplies the text below as well. Without this reset the sparks came
				out at the alpha of the last ember, so they were bright or almost
				invisible depending on which one happened to be drawn last.
			*/
			ctx.globalAlpha = 1;
			const drag = Math.pow(0.99, step);

			for (let i = sparks.length - 1; i >= 0; i--) {
				const s = sparks[i];
				// Thrown up hard, then carried by the heat at a steadier rise, so
				// they reach the top of the screen instead of falling back.
				s.vy += (s.lift - s.vy) * Math.min(1, 0.022 * step);
				s.vx *= drag;
				s.x += s.vx * step;
				s.y += s.vy * step;
				s.life += s.lifeSpeed * step;
				if (s.life >= 1 || s.y < -40) { sparks.splice(i, 1); continue; }

				// The character flips between 0 and 1 on its own timer.
				s.flipIn -= step;
				if (s.flipIn <= 0) {
					s.char = Math.random() > 0.5 ? "1" : "0";
					s.flipIn = 4 + Math.floor(Math.random() * 14);
				}

				/*
					The glitch. Bursts fire on a timer and then decay, so a digit spends
					most of its life clean and breaks up for a fraction of a second at a
					time. The seed is re-rolled a few times mid burst so the tear moves,
					but not every frame, which would just look like noise.
				*/
				s.glitchIn -= step;
				if (s.glitchIn <= 0) {
					s.glitch = 0.55 + Math.random() * 0.45;
					s.glitchSeed = Math.floor(Math.random() * 100000);
					s.glitchIn = 14 + Math.floor(Math.random() * 74);
					s.char = Math.random() > 0.5 ? "1" : "0";
				} else if (s.glitch > 0) {
					s.glitch = Math.max(0, s.glitch - 0.085 * step);
					if (Math.random() < 0.22 * step) s.glitchSeed = Math.floor(Math.random() * 100000);
				}

				s.flow += s.flowSpeed * step;

				const alpha = Math.min(1, s.life / 0.05) * Math.max(0, 1 - s.life * s.life);
				const paint = s.isBit
					? {
						fill: bitGradient(ctx, s.x, s.y, s.size, s.flowAngle, s.flow, alpha),
						glow: bitMix(s.flow + 0.25),
					}
					: { fill: `rgba(${s.rgb},${alpha})`, glow: s.rgb };

				drawGlyph(ctx, s.char, s.x, s.y, s.size, alpha, paint, s.glitch, s.glitchSeed);
			}
		}

		function paint(now: number, step: number) {
			const t = start === 0 ? 0 : now - start;
			const p = Math.min(1, t / IGNITE_MS);
			const ignite = 1 - Math.pow(1 - p, 3);

			spawn(now, t, step, ignite);
			drawSoft(now, ignite);
			stretchSoft();
			drawEmbers(step, ignite);
			drawSparks(step);

			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = "source-over";
		}

		/** One frame of a fire that has been burning a while, for reduced motion. */
		function paintStill() {
			sparks.length = 0;
			const count = Math.round(maxSparks * 0.45);
			for (let i = 0; i < count; i++) {
				spawnSpark(1);
				const s = sparks[sparks.length - 1];
				s.y = H * (0.08 + Math.random() * 0.75);
				s.life = 0.1 + Math.random() * 0.5;
			}
			drawSoft(1200, 1);
			stretchSoft();
			drawEmbers(0, 1);
			drawSparks(0);
			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = "source-over";
		}

		function frame(now: number) {
			if (start === 0) start = now;
			/*
				Normalised against 60fps. The previous loop advanced physics by a
				fixed amount per frame, so on a 120Hz screen the whole thing ran at
				double speed.
			*/
			const step = last === 0 ? 1 : Math.min((now - last) / 16.67, 3);
			last = now;
			if (W > 0 && H > 0) paint(now, step);
			raf = requestAnimationFrame(frame);
		}

		/*
			Resizing a canvas wipes it, and a resize is reported after this frame's
			drawing, so the frame is drawn again straight away. Otherwise a phone
			would flash black each time its address bar slid.
		*/
		const observer = new ResizeObserver(() => {
			const size = Math.min(window.devicePixelRatio || 1, 2);
			if (cv.offsetWidth === W && cv.offsetHeight === H && size === dpr) return;
			if (!layout()) return;
			if (reduced) paintStill();
			else paint(performance.now(), 0);
		});
		observer.observe(cv);

		const sized = layout();
		if (reduced) {
			// One frame, no loop. Nobody who asked the system to stop animating
			// needs a fire moving behind a loading message.
			if (sized) paintStill();
		} else {
			raf = requestAnimationFrame(frame);
		}

		return () => {
			cancelAnimationFrame(raf);
			observer.disconnect();
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="block h-full w-full"
			aria-hidden="true"
		/>
	);
}
