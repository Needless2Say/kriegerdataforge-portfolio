"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { bitGradient, bitMix, drawGlyph } from "@/utils/binaryGlyph";
import { clearCanvas, fitCanvas, makeBlob } from "@/utils/blobSprite";

/*
	A sent message breaking into bits and leaving the top of the screen.

	The contact page is called Transmission, so when a message goes, it goes.
	Every visible character of the form becomes a 0 or a 1 in the spot where it
	was typed, the form clears in the same moment, and the bits hold for a beat
	before streaming upward and accelerating off the top of the screen.

	The canvas is portalled to the body. Every page sits inside a Reveal and a
	page transition, both of which leave a transform on their element, and a
	transformed ancestor turns `position: fixed` into positioned relative to
	that ancestor instead of the screen.
*/

/** At most this many bits, sampled evenly from however much was typed. */
const MAX_POINTS = 140;

/** Longest the stream is allowed to run, however slow the frames. */
const MAX_MS = 2600;

export interface TransmitPoint {
	x: number;       // viewport space, where the character was
	y: number;
	size: number;
	delay: number;   // ms before it launches
}

let measurer: CanvasRenderingContext2D | null = null;

function textWidth(text: string, font: string): number {
	if (!measurer) measurer = document.createElement("canvas").getContext("2d");
	if (!measurer) return text.length * 8;
	measurer.font = font;
	return measurer.measureText(text).width;
}

/**
 * Where every visible character of some form fields is, on screen.
 *
 * Args:
 *     fields: The inputs and textareas to read, in the order they should launch.
 *
 * Returns:
 *     One point per visible character, spaces left out, capped at MAX_POINTS.
 *
 * Call it before the form is reset, since it reads the values. A textarea's
 * wrapping is not exposed by the browser, so lines are wrapped here the same
 * way, by measuring words against the box. Close enough that each bit lands on
 * the text it replaces.
 */
export function charPoints(fields: (HTMLInputElement | HTMLTextAreaElement)[]): TransmitPoint[] {
	const points: TransmitPoint[] = [];

	fields.forEach((field, order) => {
		const value = field.value;
		if (!value.trim()) return;

		const cs = getComputedStyle(field);
		const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
		const size = parseFloat(cs.fontSize) || 14;
		const box = field.getBoundingClientRect();
		const left = box.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft);
		const top = box.top + parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop);
		const width = box.width - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth)
			- parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
		const height = box.height - parseFloat(cs.borderTopWidth) - parseFloat(cs.borderBottomWidth)
			- parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
		const lineHeight = parseFloat(cs.lineHeight) || size * 1.4;
		const base = order * 70;

		// Lines of text as they sit in the box, each a list of characters.
		const lines: string[] = [];
		if (field instanceof HTMLTextAreaElement) {
			for (const paragraph of value.split("\n")) {
				let line = "";
				for (const word of paragraph.split(/(\s+)/)) {
					if (line && textWidth(line + word, font) > width) {
						lines.push(line);
						line = word.trimStart();
					} else {
						line += word;
					}
				}
				lines.push(line);
			}
		} else {
			lines.push(value);
		}

		lines.forEach((line, row) => {
			const y = field instanceof HTMLTextAreaElement
				? top + row * lineHeight + lineHeight / 2 - field.scrollTop
				: box.top + box.height / 2;
			if (y < top - 2 || y > top + height + 2) return;

			for (let i = 0; i < line.length; i++) {
				if (/\s/.test(line[i])) continue;
				const x = left + textWidth(line.slice(0, i), font) + textWidth(line[i], font) / 2 - field.scrollLeft;
				if (x > left + width) break;
				points.push({ x, y, size, delay: base + row * 45 + Math.random() * 110 });
			}
		});
	});

	if (points.length <= MAX_POINTS) return points;
	const stride = points.length / MAX_POINTS;
	return Array.from({ length: MAX_POINTS }, (_, i) => points[Math.floor(i * stride)]);
}

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	size: number;
	delay: number;
	char: string;
	flipIn: number;
	glitch: number;
	glitchIn: number;
	glitchSeed: number;
	flow: number;
	flowSpeed: number;
	flowAngle: number;
}

interface TransmissionProps {
	points: TransmitPoint[];
	onDone: () => void;
}

export default function Transmission({ points, onDone }: TransmissionProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Held in a ref so a new callback from the form never restarts the stream.
	const doneRef = useRef(onDone);
	useEffect(() => { doneRef.current = onDone; }, [onDone]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || points.length === 0) {
			doneRef.current();
			return;
		}
		const context = canvas.getContext("2d");
		if (!context) {
			doneRef.current();
			return;
		}
		// Annotated rather than narrowed, for the hoisted draw helpers below.
		const ctx: CanvasRenderingContext2D = context;
		const cv: HTMLCanvasElement = canvas;
		const dpr = fitCanvas(cv, ctx, window.innerWidth, window.innerHeight);

		const trail = makeBlob("129,120,246");
		const centre = points.reduce((sum, p) => sum + p.x, 0) / points.length;

		const particles: Particle[] = points.map((p) => ({
			x: p.x,
			y: p.y,
			vx: 0,
			vy: 0,
			// Never smaller than the size at which the blend stops reading.
			size: Math.max(14, Math.round(p.size)),
			delay: p.delay,
			char: Math.random() > 0.5 ? "1" : "0",
			flipIn: 3 + Math.floor(Math.random() * 10),
			glitch: 0.6,
			glitchIn: 8 + Math.floor(Math.random() * 40),
			glitchSeed: Math.floor(Math.random() * 100000),
			flow: Math.random(),
			flowSpeed: 0.014 + Math.random() * 0.016,
			flowAngle: (Math.random() - 0.5) * 1.2,
		}));

		let raf = 0;
		let start = 0;
		let last = 0;

		function frame(now: number) {
			if (start === 0) start = now;
			const step = last === 0 ? 1 : Math.min((now - last) / 16.67, 3);
			last = now;
			const t = now - start;

			clearCanvas(cv, ctx, dpr);

			for (let i = particles.length - 1; i >= 0; i--) {
				const p = particles[i];
				const launched = t >= p.delay;

				if (launched) {
					// Accelerating, and drawn in a little toward the middle so the
					// scattered text gathers into one stream on the way up.
					p.vy = Math.max(-30, p.vy - 0.62 * step);
					p.vx += ((centre - p.x) * 0.0016 + (Math.random() - 0.5) * 0.2) * step;
					p.vx *= 0.96;
					p.x += p.vx * step;
					p.y += p.vy * step;
					if (p.y < -40) { particles.splice(i, 1); continue; }
				}

				p.flipIn -= step;
				if (p.flipIn <= 0) {
					p.char = Math.random() > 0.5 ? "1" : "0";
					p.flipIn = 3 + Math.floor(Math.random() * 10);
				}

				p.glitchIn -= step;
				if (p.glitchIn <= 0) {
					p.glitch = 0.5 + Math.random() * 0.5;
					p.glitchSeed = Math.floor(Math.random() * 100000);
					p.glitchIn = 14 + Math.floor(Math.random() * 60);
				} else if (p.glitch > 0) {
					p.glitch = Math.max(0, p.glitch - 0.09 * step);
				}
				p.flow += p.flowSpeed * step;

				// The streak it leaves behind, longer the faster it goes.
				if (launched) {
					const reach = Math.min(90, -p.vy * 3.2);
					ctx.globalCompositeOperation = "lighter";
					ctx.globalAlpha = 0.55;
					ctx.drawImage(trail, p.x - p.size * 0.35, p.y, p.size * 0.7, reach);
				}

				drawGlyph(ctx, p.char, p.x, p.y, p.size, 1, {
					fill: bitGradient(ctx, p.x, p.y, p.size, p.flowAngle, p.flow, 1),
					glow: bitMix(p.flow + 0.25),
				}, p.glitch, p.glitchSeed);
			}

			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = "source-over";

			if (particles.length === 0 || t > MAX_MS) {
				doneRef.current();
				return;
			}
			raf = requestAnimationFrame(frame);
		}

		raf = requestAnimationFrame(frame);
		return () => cancelAnimationFrame(raf);
	}, [points]);

	return createPortal(
		<canvas
			ref={canvasRef}
			aria-hidden="true"
			className="pointer-events-none fixed left-0 top-0 z-[120]"
			style={{ display: "block" }}
		/>,
		document.body,
	);
}
