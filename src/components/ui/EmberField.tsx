"use client";

import { useEffect, useRef } from "react";

import { bitGradient, bitMix, drawGlyph } from "@/utils/binaryGlyph";

/*
	The background on every page. Same idea as before, embers drifting up through
	slow coloured glows, with the forge itself added underneath.

	What is new is the bed of fire along the bottom edge, as though the page is
	sitting just above a forge. It flickers on layered sine waves rather than on
	one, so it never settles into a visible beat. The embers now sway and flicker
	on their way up instead of rising in straight lines at a constant brightness,
	and a few binary glyphs drift up with them in the purple and blue used for
	bits elsewhere on the site.

	Soft shapes are pre-rendered sprites drawn with `lighter`. The previous
	version built a fresh radial gradient for every glow on every frame, which is
	the most expensive thing a canvas can do per frame and bought nothing.
*/

interface Ember {
	x: number;
	y: number;
	vx: number;
	vy: number;
	size: number;
	phase: number;
	phaseSpeed: number;
	flicker: number;
	rgb: string;
}

interface Glow {
	x: number;
	y: number;
	radius: number;
	rgb: string;
	opacity: number;
	opacityDelta: number;
	driftX: number;
	driftY: number;
}

interface Lobe {
	at: number;         // 0 to 1 across the viewport
	width: number;
	height: number;
	phase: number;
	speed: number;
	rgb: string;
}

interface Streak {
	x: number;
	y: number;
	vx: number;
	length: number;
	rgb: string;
	life: number;
	lifeSpeed: number;
}

interface Bit {
	x: number;
	y: number;
	vy: number;
	char: string;
	size: number;
	phase: number;
	flipIn: number;
	life: number;
	lifeSpeed: number;
	flow: number;       // where the blue/purple blend currently sits
	flowSpeed: number;  // how fast it travels across the glyph
	flowAngle: number;  // which way it travels
	glitch: number;     // 0 clean, up to 1 fully broken up
	glitchIn: number;   // frames until the next burst
	glitchSeed: number; // fixes the tear pattern
}

const EMBER_RGB = ["245,158,11", "251,146,60", "253,186,116", "252,211,77"];
const BIT_RGB   = ["168,85,247", "96,165,250", "129,140,248"];
const FIRE_RGB  = ["249,115,22", "245,158,11", "185,28,28", "251,191,36"];

const EMBER_COUNT = 120;
const MAX_BITS    = 14;
const MAX_STREAKS = 3;

function makeBlob(rgb: string): HTMLCanvasElement {
	const size = 128;
	const c = document.createElement("canvas");
	c.width = size;
	c.height = size;
	const g = c.getContext("2d");
	if (!g) return c;

	const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
	grad.addColorStop(0, "rgba(" + rgb + ",1)");
	grad.addColorStop(0.4, "rgba(" + rgb + ",0.42)");
	grad.addColorStop(1, "rgba(" + rgb + ",0)");
	g.fillStyle = grad;
	g.fillRect(0, 0, size, size);
	return c;
}

export default function EmberField() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const mouseRef  = useRef({ x: 0, y: 0 });

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const context = canvas.getContext("2d");
		if (!context) return;
		// Annotated rather than narrowed. TypeScript drops a narrowing inside
		// hoisted function declarations, and every draw helper below is one.
		const ctx: CanvasRenderingContext2D = context;

		const cv = canvas;
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		const sprites: Record<string, HTMLCanvasElement> = {};
		function blobFor(rgb: string): HTMLCanvasElement {
			if (!sprites[rgb]) sprites[rgb] = makeBlob(rgb);
			return sprites[rgb];
		}

		const embers: Ember[] = [];
		const glows: Glow[] = [];
		const lobes: Lobe[] = [];
		const streaks: Streak[] = [];
		const bits: Bit[] = [];

		let W = 0, H = 0, dpr = 1;
		let raf = 0;
		let last = 0;
		let nextStreak = 0;
		let nextBit = 0;

		function seedGlows() {
			glows.length = 0;
			glows.push(
				{ x: W * 0.08, y: H * 0.85, radius: 320, rgb: "245,158,11", opacity: 0.045, opacityDelta:  0.00018, driftX:  0.008, driftY: -0.004 },
				{ x: W * 0.85, y: H * 0.78, radius: 280, rgb: "251,146,60", opacity: 0.040, opacityDelta: -0.00015, driftX: -0.010, driftY:  0.006 },
				{ x: W * 0.50, y: H * 0.92, radius: 380, rgb: "180,83,9",   opacity: 0.035, opacityDelta:  0.00012, driftX:  0.005, driftY: -0.003 },
				{ x: W * 0.30, y: H * 0.20, radius: 200, rgb: "168,85,247", opacity: 0.030, opacityDelta: -0.00010, driftX: -0.006, driftY:  0.005 },
			);
		}

		function seedLobes() {
			lobes.length = 0;
			for (let i = 0; i < 9; i++) {
				lobes.push({
					at: i / 8,
					width: 180 + Math.random() * 220,
					height: 90 + Math.random() * 130,
					phase: Math.random() * Math.PI * 2,
					speed: 0.0009 + Math.random() * 0.0016,
					rgb: FIRE_RGB[i % FIRE_RGB.length],
				});
			}
		}

		function seedEmbers() {
			embers.length = 0;
			for (let i = 0; i < EMBER_COUNT; i++) {
				embers.push({
					x: Math.random() * W,
					y: H * (0.3 + Math.random() * 0.75),
					vx: (Math.random() - 0.5) * 0.22,
					vy: -(0.18 + Math.random() * 0.5),
					size: 0.8 + Math.random() * 1.8,
					phase: Math.random() * Math.PI * 2,
					phaseSpeed: 0.012 + Math.random() * 0.03,
					flicker: 0.3 + Math.random() * 0.45,
					rgb: EMBER_RGB[Math.floor(Math.random() * EMBER_RGB.length)],
				});
			}
		}

		function resize() {
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			W = window.innerWidth;
			H = window.innerHeight;
			cv.width = Math.round(W * dpr);
			cv.height = Math.round(H * dpr);
			cv.style.width = W + "px";
			cv.style.height = H + "px";
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			seedGlows();
			seedLobes();
			if (embers.length === 0) seedEmbers();
		}

		resize();
		window.addEventListener("resize", resize);

		const onMouseMove = (e: MouseEvent) => {
			mouseRef.current = {
				x: (e.clientX / window.innerWidth  - 0.5) * 2,
				y: (e.clientY / window.innerHeight - 0.5) * 2,
			};
		};
		window.addEventListener("mousemove", onMouseMove);

		function blob(rgb: string, x: number, y: number, r: number, alpha: number) {
			if (alpha <= 0.002) return;
			ctx.globalAlpha = alpha;
			ctx.drawImage(blobFor(rgb), x - r, y - r, r * 2, r * 2);
		}

		function drawForgeBed(now: number) {
			/*
				The forge is off the bottom of the page, so each lobe is anchored
				below the edge and only its upper half shows. Two sine terms per lobe
				at unrelated rates keep the flicker from looking like a pulse.
			*/
			ctx.globalCompositeOperation = "lighter";
			for (const lo of lobes) {
				const flick =
					0.55 +
					0.3 * Math.sin(now * lo.speed + lo.phase) +
					0.15 * Math.sin(now * lo.speed * 3.1 + lo.phase * 1.7);
				const x = lo.at * W + Math.sin(now * lo.speed * 0.7 + lo.phase) * 26;
				const r = lo.width * (0.72 + 0.28 * flick);
				blob(lo.rgb, x, H + lo.height * 0.55, r, 0.05 + flick * 0.055);
			}
			// One soft wash over the whole bottom edge so the lobes read as one fire.
			blob("249,115,22", W * 0.5, H + 40, Math.max(W, 700) * 0.62, 0.05);
		}

		function drawGlows(step: number) {
			ctx.globalCompositeOperation = "lighter";
			for (const g of glows) {
				g.x += g.driftX * step;
				g.y += g.driftY * step;
				g.opacity += g.opacityDelta * step;
				if (g.opacity > 0.07 || g.opacity < 0.015) g.opacityDelta *= -1;
				g.opacity = Math.max(0.015, Math.min(0.07, g.opacity));
				blob(g.rgb, g.x, g.y, g.radius, g.opacity * 1.6);
			}
		}

		function drawEmbers(step: number) {
			ctx.globalCompositeOperation = "lighter";
			const px = mouseRef.current.x;
			const py = mouseRef.current.y;

			for (const e of embers) {
				e.phase += e.phaseSpeed * step;
				// Sway, so they rise the way something caught in rising heat does.
				e.x += (e.vx + Math.sin(e.phase) * 0.25) * step;
				e.y += e.vy * step;
				if (e.y < -10) {
					e.y = H + 5;
					e.x = Math.random() * W;
				}
				if (e.x < -20) e.x = W + 10;
				if (e.x > W + 20) e.x = -10;

				// Brightness breathes on its own phase, so no two embers flicker alike.
				const alpha = e.flicker * (0.55 + 0.45 * Math.sin(e.phase * 1.7));
				ctx.globalAlpha = Math.max(0, alpha);
				ctx.beginPath();
				ctx.arc(e.x + px * e.size * 5, e.y + py * e.size * 5, e.size, 0, Math.PI * 2);
				ctx.fillStyle = "rgb(" + e.rgb + ")";
				ctx.fill();
			}
			ctx.globalAlpha = 1;
		}

		function drawBits(now: number, step: number) {
			if (now >= nextBit && bits.length < MAX_BITS) {
				bits.push({
					x: Math.random() * W,
					y: H + 20,
					vy: -(0.35 + Math.random() * 0.6),
					char: Math.random() > 0.5 ? "1" : "0",
					size: 13 + Math.floor(Math.random() * 8),
					phase: Math.random() * Math.PI * 2,
					flipIn: 20 + Math.floor(Math.random() * 60),
					life: 0,
					lifeSpeed: 0.0016 + Math.random() * 0.0016,
					flow: Math.random(),
					// Slower than the loader's sparks. These drift for many seconds, and
					// at the loader's rate the colour would strobe rather than flow.
					flowSpeed: 0.005 + Math.random() * 0.007,
					flowAngle: (Math.random() - 0.5) * 1.2,
					glitch: 0,
					// Rarer and softer than the loader's. This is behind the text on
					// every page, so it has to stay something you notice, not something
					// that pulls your eye off what you are reading.
					glitchIn: 90 + Math.floor(Math.random() * 260),
					glitchSeed: Math.floor(Math.random() * 100000),
				});
				nextBit = now + 700 + Math.random() * 1800;
			}

			ctx.globalCompositeOperation = "lighter";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";

			for (let i = bits.length - 1; i >= 0; i--) {
				const b = bits[i];
				b.phase += 0.02 * step;
				b.x += Math.sin(b.phase) * 0.3 * step;
				b.y += b.vy * step;
				b.life += b.lifeSpeed * step;
				b.flipIn -= step;
				b.flow += b.flowSpeed * step;
				if (b.flipIn <= 0) {
					b.char = Math.random() > 0.5 ? "1" : "0";
					b.flipIn = 20 + Math.floor(Math.random() * 60);
				}

				b.glitchIn -= step;
				if (b.glitchIn <= 0) {
					b.glitch = 0.35 + Math.random() * 0.35;
					b.glitchSeed = Math.floor(Math.random() * 100000);
					b.glitchIn = 90 + Math.floor(Math.random() * 260);
				} else if (b.glitch > 0) {
					b.glitch = Math.max(0, b.glitch - 0.06 * step);
				}

				if (b.life >= 1 || b.y < -30) { bits.splice(i, 1); continue; }

				const fade = Math.max(0, b.life < 0.12 ? b.life / 0.12 : 1 - (b.life - 0.12) / 0.88);
				const alpha = fade * 0.42;
				// Same travelling blue/purple blend the loader's sparks use.
				drawGlyph(
					ctx, b.char, b.x, b.y, b.size, alpha,
					{
						fill: bitGradient(ctx, b.x, b.y, b.size, b.flowAngle, b.flow, alpha),
						glow: bitMix(b.flow + 0.25),
					},
					b.glitch, b.glitchSeed,
				);
			}
		}

		function drawStreaks(now: number, step: number) {
			if (now >= nextStreak && streaks.length < MAX_STREAKS) {
				const fromLeft = Math.random() > 0.5;
				streaks.push({
					x: fromLeft ? -80 : W + 80,
					y: H * (0.1 + Math.random() * 0.8),
					vx: (fromLeft ? 1 : -1) * (2.5 + Math.random() * 2),
					length: 60 + Math.random() * 80,
					rgb: BIT_RGB[Math.floor(Math.random() * BIT_RGB.length)],
					life: 0,
					lifeSpeed: 0.006 + Math.random() * 0.004,
				});
				nextStreak = now + 4000 + Math.random() * 8000;
			}

			ctx.globalCompositeOperation = "lighter";
			for (let i = streaks.length - 1; i >= 0; i--) {
				const s = streaks[i];
				s.x += s.vx * step;
				s.life += s.lifeSpeed * step;
				if (s.life >= 1) { streaks.splice(i, 1); continue; }

				const alpha =
					s.life < 0.15 ? s.life / 0.15 :
					s.life > 0.7  ? Math.max(0, (1 - s.life) / 0.3) : 1;
				const tailX = s.x - Math.sign(s.vx) * s.length;
				const grad = ctx.createLinearGradient(s.x, s.y, tailX, s.y);
				grad.addColorStop(0, "rgba(" + s.rgb + "," + alpha * 0.7 + ")");
				grad.addColorStop(0.4, "rgba(" + s.rgb + "," + alpha * 0.35 + ")");
				grad.addColorStop(1, "rgba(" + s.rgb + ",0)");
				ctx.beginPath();
				ctx.moveTo(s.x, s.y);
				ctx.lineTo(tailX, s.y);
				ctx.strokeStyle = grad;
				ctx.lineWidth = 1;
				ctx.stroke();
			}
		}

		function drawCursorHeat() {
			const cx = (mouseRef.current.x / 2 + 0.5) * W;
			const cy = (mouseRef.current.y / 2 + 0.5) * H;
			ctx.globalCompositeOperation = "lighter";
			blob("245,158,11", cx, cy, 160, 0.05);
		}

		function clearAll() {
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, cv.width, cv.height);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		}

		function frame(now: number) {
			// Normalised against 60fps so nothing runs at double speed on a 120Hz
			// screen, which is what the previous fixed-step loop did.
			const step = last === 0 ? 1 : Math.min((now - last) / 16.67, 3);
			last = now;

			clearAll();
			drawCursorHeat();
			drawForgeBed(now);
			drawGlows(step);
			drawEmbers(step);
			drawBits(now, step);
			drawStreaks(now, step);

			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = "source-over";
			raf = requestAnimationFrame(frame);
		}

		if (reduced) {
			// A single still frame. The page still has its warmth, nothing moves.
			clearAll();
			drawForgeBed(0);
			drawGlows(0);
			drawEmbers(0);
			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = "source-over";
		} else {
			raf = requestAnimationFrame(frame);
		}

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", resize);
			window.removeEventListener("mousemove", onMouseMove);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="fixed inset-0 pointer-events-none z-0"
			aria-hidden="true"
		/>
	);
}
