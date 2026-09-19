"use client";

import { useEffect, useRef } from "react";

import { bitGradient, bitMix, drawGlyph } from "@/utils/binaryGlyph";

/*
	The forge fire that burns while the site loads, in place of the old anvil.

	Three things are on screen. A bed of coals at the base, the flame above it,
	and the sparks the flame throws off, which are glitching 0s and 1s rather
	than ordinary embers. Sparks come in two families, fire coloured and bit
	coloured, so the idea reads both ways. Computer bits going into the fire,
	hot metal coming back out of it.

	Everything soft is drawn from pre-rendered blob sprites composited with
	`lighter`. Building a radial gradient per particle per frame is what made the
	previous animation stutter, and a sprite drawn additively gives the same
	bloom for a fraction of the cost.
*/

interface Spark {
	x: number;
	y: number;
	vx: number;
	vy: number;
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

interface Tongue {
	offset: number;      // -1 to 1 across the coal bed
	reach: number;       // share of the available height this tongue climbs
	widthFactor: number; // share of the coal bed half width, resolved at draw time
	phase: number;
	speed: number;
}

// Hottest at the base, coolest at the tip.
const FLAME_RGB = ["255,246,214", "251,191,36", "249,115,22", "185,28,28"];

const SPARK_FIRE = ["245,158,11", "251,146,60", "239,68,68"];

// Lower than it was, because the digits are now large enough to read and the
// old count at this size crowded the fire out.
const MAX_SPARKS = 62;
const MAX_EMBERS = 40;

function makeBlob(rgb: string): HTMLCanvasElement {
	const size = 64;
	const c = document.createElement("canvas");
	c.width = size;
	c.height = size;
	const g = c.getContext("2d");
	if (!g) return c;

	const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
	grad.addColorStop(0, "rgba(" + rgb + ",1)");
	grad.addColorStop(0.35, "rgba(" + rgb + ",0.5)");
	grad.addColorStop(1, "rgba(" + rgb + ",0)");
	g.fillStyle = grad;
	g.fillRect(0, 0, size, size);
	return c;
}

export default function ForgeFire() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const context = canvas.getContext("2d");
		if (!context) return;
		// Annotated rather than narrowed. TypeScript drops a narrowing inside
		// hoisted function declarations, and every draw helper below is one.
		const ctx: CanvasRenderingContext2D = context;

		const cv = canvas;
		const blobs = FLAME_RGB.map(makeBlob);
		const sparks: Spark[] = [];
		const embers: Ember[] = [];
		const tongues: Tongue[] = [];

		let W = 0, H = 0;
		let baseX = 0, baseY = 0, coalHalf = 0, flameH = 0;
		let dpr = 1;
		let raf = 0;
		let last = 0;
		let nextBurst = 0;

		function resize() {
			/*
				Backing store follows devicePixelRatio, capped at 2. The old canvas
				ignored DPR entirely, which is why it read as soft and blocky on a
				high density screen no matter what was drawn into it.
			*/
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			W = cv.offsetWidth;
			H = cv.offsetHeight;
			cv.width = Math.round(W * dpr);
			cv.height = Math.round(H * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			baseX = W * 0.5;
			baseY = H * 0.80;
			/*
				The fire is kept well inside the canvas. When it filled the width, the
				glow around its base was cut off flat at the left and right edges and
				the canvas showed up as a faint rectangle behind the flame.
			*/
			coalHalf = W * 0.19;
			flameH = H * 0.70;
		}

		/*
			Five wide tongues rather than many narrow ones. They are wider than the
			gaps between them on purpose, so additive blending fuses them into a
			single body of fire instead of leaving separate jets standing apart.
		*/
		for (let i = 0; i < 5; i++) {
			tongues.push({
				offset: ((i / 4) * 2 - 1) * 0.8,
				reach: 0.62 + Math.random() * 0.38,
				widthFactor: 0.36 + Math.random() * 0.19,
				phase: Math.random() * Math.PI * 2,
				speed: 0.0022 + Math.random() * 0.0026,
			});
		}

		resize();
		window.addEventListener("resize", resize);

		function spawnSpark(burst: boolean) {
			if (sparks.length >= MAX_SPARKS) return;
			const isBit = Math.random() < 0.45;
			const spread = burst ? 6.6 : 4.2;
			sparks.push({
				// Spawned up in the body of the flame, not down in the coals, so
				// they are seen leaving the fire rather than lost inside its core.
				x: baseX + (Math.random() - 0.5) * coalHalf * 1.1,
				y: baseY - flameH * (0.16 + Math.random() * 0.52),
				vx: (Math.random() - 0.5) * spread,
				vy: -(1.9 + Math.random() * (burst ? 4.2 : 2.8)),
				char: Math.random() > 0.5 ? "1" : "0",
				// Big enough that a gradient across the character is actually visible.
				// At the old 9 to 16px the ink is a couple of pixels wide and any
				// blend across it reads as one flat colour however it is built.
				size: 14 + Math.floor(Math.random() * 12),
				// Unused on a bit spark, which paints itself from the travelling blend.
				rgb: SPARK_FIRE[Math.floor(Math.random() * SPARK_FIRE.length)],
				isBit,
				life: 0,
				lifeSpeed: 0.008 + Math.random() * 0.009,
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

		function spawnEmber() {
			if (embers.length >= MAX_EMBERS) return;
			embers.push({
				x: baseX + (Math.random() - 0.5) * coalHalf * 2,
				y: baseY - Math.random() * 6,
				vy: -(0.3 + Math.random() * 0.7),
				phase: Math.random() * Math.PI * 2,
				size: 1 + Math.random() * 1.8,
				life: 0,
				lifeSpeed: 0.006 + Math.random() * 0.007,
			});
		}

		function blob(sprite: HTMLCanvasElement, x: number, y: number, r: number, alpha: number) {
			ctx.globalAlpha = alpha;
			ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
		}

		function drawCoals(now: number) {
			/*
				Deliberately dim. The pale sprite is reserved for the flame core, so
				the coals stay orange and red. Using it here as well turned the whole
				base into one blown out white bar.
			*/
			ctx.globalCompositeOperation = "lighter";
			for (let i = 0; i < 7; i++) {
				const t = i / 6;
				const x = baseX + (t * 2 - 1) * coalHalf;
				const heat = 0.55 + 0.45 * Math.sin(now * 0.0021 + i * 1.7);
				blob(blobs[3], x, baseY + 5 + (i % 3) * 2, coalHalf * (0.22 + heat * 0.11), 0.16 + heat * 0.12);
				blob(blobs[2], x, baseY + 3 + (i % 2) * 3, coalHalf * (0.09 + heat * 0.06), 0.11 + heat * 0.11);
			}
			// The heat the coals throw onto everything around them.
			blob(blobs[3], baseX, baseY + 6, coalHalf * 1.7, 0.16);
		}

		function drawFlame(now: number) {
			ctx.globalCompositeOperation = "lighter";
			const STEPS = 18;

			for (const tg of tongues) {
				// Two sine waves at unrelated rates, which is enough to stop the
				// flicker landing on an obvious beat.
				const flick =
					0.74 +
					0.26 * Math.sin(now * tg.speed + tg.phase) +
					0.12 * Math.sin(now * tg.speed * 2.7 + tg.phase * 1.9);
				const reach = flameH * tg.reach * Math.max(0.35, flick);

				for (let i = 0; i < STEPS; i++) {
					const p = i / (STEPS - 1);          // 0 at the coals, 1 at the tip
					const y = baseY - reach * p;
					/*
						Sideways movement grows faster than height, so the base stays
						planted on the coals while the tips lick and curl.
					*/
					const lick = Math.pow(p, 1.4);
					const sway =
						Math.sin(now * 0.0018 + tg.phase + p * 3.4) * coalHalf * 0.28 * lick +
						Math.sin(now * 0.0037 + tg.phase * 2.3 + p * 6.1) * coalHalf * 0.13 * lick;
					const x = baseX + tg.offset * coalHalf * 0.7 + sway;
					const r = coalHalf * tg.widthFactor * Math.pow(1 - p, 0.55) * (0.66 + 0.34 * flick);

					// Body. Amber low down, orange through the middle, red at the tip.
					const sprite = p < 0.42 ? blobs[1] : p < 0.75 ? blobs[2] : blobs[3];
					blob(sprite, x, y, r, (1 - p * 0.72) * 0.26);

					// Core. A narrower column of near white, only in the lower third,
					// which is what gives the fire a hot centre instead of a flat wash.
					if (p < 0.34) {
						blob(blobs[0], x, y, r * 0.36, (1 - p / 0.34) * 0.2);
					}
				}
			}
		}

		function drawEmbers(step: number) {
			ctx.globalCompositeOperation = "lighter";
			for (let i = embers.length - 1; i >= 0; i--) {
				const e = embers[i];
				e.y += e.vy * step;
				e.phase += 0.05 * step;
				e.x += Math.sin(e.phase) * 0.4 * step;
				e.life += e.lifeSpeed * step;
				if (e.life >= 1) { embers.splice(i, 1); continue; }

				const fade = e.life < 0.2 ? e.life / 0.2 : 1 - (e.life - 0.2) / 0.8;
				blob(blobs[1], e.x, e.y, e.size * 3, fade * 0.5);
			}
		}

		function drawSparks(step: number) {
			ctx.globalCompositeOperation = "lighter";
			/*
				blob() leaves globalAlpha set to whatever it last drew with, and that
				multiplies the text below as well. Without this reset the sparks came
				out at the alpha of the last flame blob, so they were bright or almost
				invisible depending on which particle happened to be drawn last.
			*/
			ctx.globalAlpha = 1;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";

			for (let i = sparks.length - 1; i >= 0; i--) {
				const s = sparks[i];
				s.x += s.vx * step;
				s.y += s.vy * step;
				s.vy += 0.058 * step;    // gravity pulls them back down into the fire
				s.vx *= 0.992;
				s.life += s.lifeSpeed * step;
				if (s.life >= 1) { sparks.splice(i, 1); continue; }

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

				const alpha = Math.max(0, 1 - s.life * s.life);
				const paint = s.isBit
					? {
						fill: bitGradient(ctx, s.x, s.y, s.size, s.flowAngle, s.flow, alpha),
						glow: bitMix(s.flow + 0.25),
					}
					: { fill: `rgba(${s.rgb},${alpha})`, glow: s.rgb };

				drawGlyph(ctx, s.char, s.x, s.y, s.size, alpha, paint, s.glitch, s.glitchSeed);
			}
		}

		function clearAll() {
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, cv.width, cv.height);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		}

		function frame(now: number) {
			/*
				Normalised against 60fps. The previous loop advanced physics by a
				fixed amount per frame, so on a 120Hz screen the whole thing ran at
				double speed.
			*/
			const step = last === 0 ? 1 : Math.min((now - last) / 16.67, 3);
			last = now;

			clearAll();

			/*
				Spawn rate follows the canvas width. The digits are a fixed pixel size
				so they stay legible, which means a narrow phone canvas would otherwise
				end up with the same number of them packed into two thirds the room.
			*/
			const density = Math.min(1, W / 384);

			if (Math.random() < 0.32 * step * density) spawnSpark(false);
			if (Math.random() < 0.28 * step) spawnEmber();
			if (now > nextBurst) {
				const count = Math.round((5 + Math.floor(Math.random() * 6)) * density);
				for (let i = 0; i < count; i++) spawnSpark(true);
				nextBurst = now + 650 + Math.random() * 900;
			}

			drawCoals(now);
			drawFlame(now);
			drawEmbers(step);
			drawSparks(step);

			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = "source-over";
			raf = requestAnimationFrame(frame);
		}

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			// One frame, no loop. Nobody who asked the system to stop animating
			// needs a fire moving behind a loading message.
			for (let i = 0; i < 14; i++) spawnSpark(false);
			for (let i = 0; i < 10; i++) spawnEmber();
			clearAll();
			drawCoals(1200);
			drawFlame(1200);
			drawEmbers(0);
			drawSparks(0);
			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = "source-over";
		} else {
			raf = requestAnimationFrame(frame);
		}

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", resize);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="w-full h-full"
			aria-hidden="true"
			style={{ display: "block" }}
		/>
	);
}
