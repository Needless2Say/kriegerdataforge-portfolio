"use client";

import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type CSSProperties,
	type ReactNode,
	type RefObject,
} from "react";

import { bitGradient, bitMix, drawGlyph } from "@/utils/binaryGlyph";
import { FLAME_RGB, SPARK_RGB, clearCanvas, fitCanvas, makeBlob, prefersReducedMotion } from "@/utils/blobSprite";
import { hasPlayed, markPlayed, playId } from "@/utils/playOnce";
import { useLoaderSeen } from "@/utils/useLoaderSeen";

/*
	The wordmark takes a hammer blow as the page arrives.

	The loader shows a fire, and until now the page simply faded in after it, so
	nothing the fire did ever reached the page. Here the blow lands on the name
	itself. A white flash and a shockwave, sparks and 0s and 1s thrown off the
	metal, and the letters glow white hot and cool back through yellow and
	orange into the amber they rest at, the way struck iron does.

	Three layers, deliberately separate. The heading keeps its own entrance and
	its own colour sweep untouched. The wrapper around it carries the heat and
	the jolt of the impact, so the heading's animations are never replaced
	partway through. The canvas with the sparks sits beside the wrapper rather
	than inside it, because inside it the sparks would be heat filtered too.
*/

/**
 * How long after the hero starts fading in the blow lands.
 *
 * Long enough for the fade and the heading's own entrance to finish. Landing
 * earlier catches the entrance partway, and the name visibly jumps the last
 * few pixels into place.
 */
const STRIKE_DELAY_MS = 760;

/** Until the last spark has gone. The heat itself runs 1.4s in CSS. */
const STRIKE_MS = 1500;

/*
	How far the spark canvas reaches above and below the letters. Across, it
	spans the whole viewport. Any narrower and the outer ring was cut off flat
	at the canvas edge partway across the screen, and any wider would push the
	page sideways on a phone.
*/
const PAD_Y = 170;

const SPARK_COUNT = 46;
const BIT_COUNT   = 16;

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

type Phase = "waiting" | "striking" | "done";

interface StruckWordmarkProps {
	className?: string;
	style?: CSSProperties;
	children: ReactNode;
}

export default function StruckWordmark({ className, style, children }: StruckWordmarkProps) {
	const seen = useLoaderSeen();
	const [phase, setPhase] = useState<Phase>("waiting");
	const struckRef = useRef(false);
	const outerRef = useRef<HTMLDivElement>(null);
	const headingRef = useRef<HTMLHeadingElement>(null);

	// Once per tab. A return to the home page finds the name already struck.
	useEffect(() => {
		if (!seen || struckRef.current || prefersReducedMotion()) return;
		const id = playId("wordmark-strike");
		if (hasPlayed(id)) return;
		const timer = window.setTimeout(() => {
			struckRef.current = true;
			markPlayed(id);
			setPhase("striking");
		}, STRIKE_DELAY_MS);
		return () => window.clearTimeout(timer);
	}, [seen]);

	const finish = useCallback(() => setPhase("done"), []);

	return (
		<div ref={outerRef} className="relative">
			<div className={phase === "striking" ? "wordmark-strike" : undefined}>
				<h1 ref={headingRef} className={className} style={style}>
					{children}
				</h1>
			</div>
			{phase === "striking" && (
				<StrikeBurst outerRef={outerRef} headingRef={headingRef} onDone={finish} />
			)}
		</div>
	);
}

interface StrikeBurstProps {
	outerRef: RefObject<HTMLDivElement | null>;
	headingRef: RefObject<HTMLHeadingElement | null>;
	onDone: () => void;
}

function StrikeBurst({ outerRef, headingRef, onDone }: StrikeBurstProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Held in a ref so a new callback from the parent never restarts the burst.
	const doneRef = useRef(onDone);
	useEffect(() => { doneRef.current = onDone; }, [onDone]);

	useEffect(() => {
		const canvas = canvasRef.current;
		const outer = outerRef.current;
		const heading = headingRef.current;
		if (!canvas || !outer || !heading) return;

		const context = canvas.getContext("2d");
		if (!context) {
			doneRef.current();
			return;
		}
		// Annotated rather than narrowed. TypeScript drops a narrowing inside
		// hoisted function declarations, and the draw helpers below are those.
		const ctx: CanvasRenderingContext2D = context;
		const cv: HTMLCanvasElement = canvas;

		/*
			Where the letters actually are. The heading is a full width block with
			its text centred in it, so its own box says nothing about where the
			word sits. A range over its contents measures the word itself.
		*/
		const range = document.createRange();
		range.selectNodeContents(heading);
		const text = range.getBoundingClientRect();
		const box = outer.getBoundingClientRect();
		if (text.width === 0 || text.height === 0) {
			doneRef.current();
			return;
		}

		// Canvas x is viewport x, so nothing below has to convert between them.
		const W = document.documentElement.clientWidth;
		const H = text.height + PAD_Y * 2;
		cv.style.left = `${-box.left}px`;
		cv.style.top = `${text.top - box.top - PAD_Y}px`;
		const dpr = fitCanvas(cv, ctx, W, H);

		const tw = text.width;
		const th = text.height;
		const cx = text.left + tw / 2;
		const cy = PAD_Y + th * 0.52;

		const blobs = FLAME_RGB.map(makeBlob);
		const sparks: Spark[] = [];
		const bits: Bit[] = [];

		function spawnSparks(count: number, power: number) {
			for (let i = 0; i < count; i++) {
				// Mostly up and out, a few skimming sideways off the anvil.
				const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.15;
				const speed = (4 + Math.random() * 7.5) * power;
				sparks.push({
					x: cx + (Math.random() - 0.5) * tw * 0.36,
					y: cy + (Math.random() - 0.5) * th * 0.3,
					vx: Math.cos(angle) * speed * 1.25,
					vy: Math.sin(angle) * speed,
					rgb: SPARK_RGB[Math.floor(Math.random() * SPARK_RGB.length)],
					life: 0,
					lifeSpeed: 0.02 + Math.random() * 0.022,
				});
			}
		}

		function spawnBits() {
			for (let i = 0; i < BIT_COUNT; i++) {
				const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.95;
				const speed = 2.6 + Math.random() * 4.2;
				bits.push({
					x: cx + (Math.random() - 0.5) * tw * 0.5,
					y: cy,
					vx: Math.cos(angle) * speed * 1.4,
					vy: Math.sin(angle) * speed,
					char: Math.random() > 0.5 ? "1" : "0",
					// Large enough that the blue to purple blend reads on the glyph.
					size: 14 + Math.floor(Math.random() * 8),
					life: 0,
					lifeSpeed: 0.012 + Math.random() * 0.01,
					flipIn: 4 + Math.floor(Math.random() * 12),
					glitch: 0.7,
					glitchIn: 10 + Math.floor(Math.random() * 40),
					glitchSeed: Math.floor(Math.random() * 100000),
					flow: Math.random(),
					flowSpeed: 0.012 + Math.random() * 0.014,
					flowAngle: (Math.random() - 0.5) * 1.2,
				});
			}
		}

		function blob(sprite: HTMLCanvasElement, x: number, y: number, rx: number, ry: number, alpha: number) {
			ctx.globalAlpha = alpha;
			ctx.drawImage(sprite, x - rx, y - ry, rx * 2, ry * 2);
		}

		/** The flash of the blow and the line of light along the metal. */
		function drawFlash(t: number) {
			ctx.globalCompositeOperation = "lighter";
			if (t < 260) {
				const p = t / 260;
				const fade = (1 - p) * (1 - p);
				blob(blobs[1], cx, cy, th * 3.2 * (0.7 + p * 0.5), th * 2.1 * (0.7 + p * 0.5), 0.55 * fade);
				blob(blobs[0], cx, cy, th * 1.6 * (0.6 + p * 0.6), th * 1.1 * (0.6 + p * 0.6), 0.95 * fade);
			}
			if (t < 340) {
				const p = t / 340;
				blob(blobs[0], cx, cy, tw * 0.62 * (0.55 + p * 0.75), 5, (1 - p) * 0.85);
				blob(blobs[1], cx, cy, tw * 0.7 * (0.55 + p * 0.75), 14, (1 - p) * 0.45);
			}
		}

		/** Two rings rolling out from the blow, the second a beat behind. */
		function drawRings(t: number) {
			ctx.globalCompositeOperation = "lighter";
			ctx.globalAlpha = 1;
			for (const [delay, span, reach] of [[0, 680, 1], [95, 760, 1.25]] as const) {
				const local = t - delay;
				if (local < 0 || local > span) continue;
				const p = local / span;
				const ease = 1 - Math.pow(1 - p, 3);
				const rx = tw * 0.5 + tw * 0.34 * ease * reach;
				const ry = th * 0.75 + th * 1.1 * ease * reach;
				const alpha = Math.pow(1 - p, 2);

				ctx.beginPath();
				ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
				ctx.strokeStyle = `rgba(249,115,22,${0.28 * alpha})`;
				ctx.lineWidth = 7 * (1 - p) + 2;
				ctx.stroke();
				ctx.strokeStyle = `rgba(255,236,179,${0.7 * alpha})`;
				ctx.lineWidth = 1.6 * (1 - p) + 0.6;
				ctx.stroke();
			}
		}

		function drawSparks(step: number, fade: number) {
			ctx.globalCompositeOperation = "lighter";
			ctx.lineCap = "round";
			for (let i = sparks.length - 1; i >= 0; i--) {
				const s = sparks[i];
				s.life += s.lifeSpeed * step;
				if (s.life >= 1) { sparks.splice(i, 1); continue; }

				s.x += s.vx * step;
				s.y += s.vy * step;
				s.vy += 0.24 * step;   // they arc back down, which is what sells them as heavy
				s.vx *= 0.985;

				const alpha = (1 - s.life) * fade;
				ctx.globalAlpha = 1;
				ctx.strokeStyle = `rgba(${s.rgb},${alpha})`;
				ctx.lineWidth = 1.8;
				ctx.beginPath();
				ctx.moveTo(s.x, s.y);
				ctx.lineTo(s.x - s.vx * 2.4, s.y - s.vy * 2.4);
				ctx.stroke();
				blob(blobs[1], s.x, s.y, 4, 4, alpha * 0.7);
			}
		}

		function drawBits(step: number, fade: number) {
			for (let i = bits.length - 1; i >= 0; i--) {
				const b = bits[i];
				b.life += b.lifeSpeed * step;
				if (b.life >= 1) { bits.splice(i, 1); continue; }

				b.x += b.vx * step;
				b.y += b.vy * step;
				b.vy += 0.09 * step;
				b.vx *= 0.99;

				b.flipIn -= step;
				if (b.flipIn <= 0) {
					b.char = Math.random() > 0.5 ? "1" : "0";
					b.flipIn = 4 + Math.floor(Math.random() * 12);
				}

				// Thrown off glitching, then bursts on a timer like every digit on the site.
				b.glitchIn -= step;
				if (b.glitchIn <= 0) {
					b.glitch = 0.55 + Math.random() * 0.45;
					b.glitchSeed = Math.floor(Math.random() * 100000);
					b.glitchIn = 12 + Math.floor(Math.random() * 50);
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
		let second = false;

		function frame(now: number) {
			if (start === 0) {
				start = now;
				spawnSparks(SPARK_COUNT, 1);
				spawnBits();
			}
			// Normalised against 60fps, so a 120Hz screen does not run it double speed.
			const step = last === 0 ? 1 : Math.min((now - last) / 16.67, 3);
			last = now;
			const t = now - start;

			// A smaller second shower, the metal ringing after the blow.
			if (!second && t > 70) {
				second = true;
				spawnSparks(Math.round(SPARK_COUNT * 0.4), 0.7);
			}

			const fade = t < STRIKE_MS - 300 ? 1 : Math.max(0, (STRIKE_MS - t) / 300);

			clearCanvas(cv, ctx, dpr);
			drawFlash(t);
			drawRings(t);
			drawSparks(step, fade);
			drawBits(step, fade);
			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = "source-over";

			if (t >= STRIKE_MS) {
				doneRef.current();
				return;
			}
			raf = requestAnimationFrame(frame);
		}

		raf = requestAnimationFrame(frame);
		return () => cancelAnimationFrame(raf);
	}, [outerRef, headingRef]);

	return (
		<canvas
			ref={canvasRef}
			aria-hidden="true"
			className="pointer-events-none absolute z-10"
			style={{ display: "block" }}
		/>
	);
}
