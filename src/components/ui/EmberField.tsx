"use client";

import { useEffect, useRef } from "react";

interface Ember {
	x: number;
	y: number;
	vx: number;
	vy: number;
	size: number;
	opacity: number;
	opacityDelta: number;
	color: string;
}

interface ForgeGlow {
	x: number;
	y: number;
	radius: number;
	color: string;
	opacity: number;
	opacityDelta: number;
	driftX: number;
	driftY: number;
}

interface DataStream {
	x: number;
	y: number;
	vx: number;
	length: number;
	opacity: number;
	life: number;
	lifeSpeed: number;
}

export default function EmberField() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const mouseRef  = useRef({ x: 0, y: 0 });
	const rafRef    = useRef(0);
	const nextStreamRef = useRef(0);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d")!;

		const embers: Ember[] = [];
		const glows: ForgeGlow[] = [];
		const streams: DataStream[] = [];
		const COLORS = ["245,158,11", "251,146,60", "253,186,116", "252,211,77"];

		function makeGlows(w: number, h: number): ForgeGlow[] {
			return [
				{ x: w * 0.08, y: h * 0.85, radius: 320, color: "245,158,11",  opacity: 0.045, opacityDelta:  0.00018, driftX:  0.008, driftY: -0.004 },
				{ x: w * 0.85, y: h * 0.78, radius: 280, color: "251,146,60",  opacity: 0.040, opacityDelta: -0.00015, driftX: -0.010, driftY:  0.006 },
				{ x: w * 0.50, y: h * 0.92, radius: 380, color: "180,83,9",    opacity: 0.035, opacityDelta:  0.00012, driftX:  0.005, driftY: -0.003 },
				{ x: w * 0.30, y: h * 0.20, radius: 200, color: "59,130,246",  opacity: 0.030, opacityDelta: -0.00010, driftX: -0.006, driftY:  0.005 },
			];
		}

		function spawnEmbers(w: number, h: number, count: number) {
			for (let i = 0; i < count; i++) {
				embers.push({
					x: Math.random() * w,
					y: h * (0.4 + Math.random() * 0.6),
					vx: (Math.random() - 0.5) * 0.3,
					vy: -(0.2 + Math.random() * 0.5),
					size: 0.8 + Math.random() * 1.8,
					opacity: Math.random() * 0.6,
					opacityDelta: (Math.random() * 0.003 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
					color: COLORS[Math.floor(Math.random() * COLORS.length)],
				});
			}
		}

		function spawnStream(w: number, h: number): DataStream {
			const fromLeft = Math.random() > 0.5;
			return {
				x: fromLeft ? -80 : w + 80,
				y: h * (0.1 + Math.random() * 0.8),
				vx: fromLeft ? 2.5 + Math.random() * 2 : -(2.5 + Math.random() * 2),
				length: 60 + Math.random() * 80,
				opacity: 0,
				life: 0,
				lifeSpeed: 0.006 + Math.random() * 0.004,
			};
		}

		function resize() {
			if (!canvas) return;
			canvas.width  = window.innerWidth;
			canvas.height = window.innerHeight;
			glows.length = 0;
			makeGlows(canvas.width, canvas.height).forEach(g => glows.push(g));
		}
		resize();
		window.addEventListener("resize", resize);
		spawnEmbers(window.innerWidth, window.innerHeight, 120);

		const handleMouseMove = (e: MouseEvent) => {
			mouseRef.current = {
				x: (e.clientX / window.innerWidth  - 0.5) * 2,
				y: (e.clientY / window.innerHeight - 0.5) * 2,
			};
		};
		window.addEventListener("mousemove", handleMouseMove);

		function draw(timestamp: number) {
			const w = ctx.canvas.width, h = ctx.canvas.height;
			ctx.clearRect(0, 0, w, h);

			// ── Cursor heat glow ──
			const cx = (mouseRef.current.x / 2 + 0.5) * w;
			const cy = (mouseRef.current.y / 2 + 0.5) * h;
			const cursorGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 150);
			cursorGrad.addColorStop(0,   "rgba(245,158,11,0.04)");
			cursorGrad.addColorStop(0.5, "rgba(251,146,60,0.015)");
			cursorGrad.addColorStop(1,   "rgba(0,0,0,0)");
			ctx.fillStyle = cursorGrad;
			ctx.beginPath();
			ctx.arc(cx, cy, 150, 0, Math.PI * 2);
			ctx.fill();

			// ── Forge glows ──
			glows.forEach(g => {
				g.x += g.driftX;
				g.y += g.driftY;
				g.opacity += g.opacityDelta;
				if (g.opacity > 0.07 || g.opacity < 0.015) g.opacityDelta *= -1;
				g.opacity = Math.max(0.015, Math.min(0.07, g.opacity));

				const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.radius);
				grad.addColorStop(0,   `rgba(${g.color},${g.opacity})`);
				grad.addColorStop(0.4, `rgba(${g.color},${g.opacity * 0.5})`);
				grad.addColorStop(1,   `rgba(${g.color},0)`);
				ctx.fillStyle = grad;
				ctx.beginPath();
				ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
				ctx.fill();
			});

			// ── Embers ──
			embers.forEach(e => {
				e.x  += e.vx;
				e.y  += e.vy;
				e.opacity += e.opacityDelta;
				if (e.opacity > 0.75 || e.opacity < 0.05) e.opacityDelta *= -1;
				e.opacity = Math.max(0.05, Math.min(0.75, e.opacity));
				if (e.y < -10) {
					e.y = h + 5;
					e.x = Math.random() * w;
				}

				const px = mouseRef.current.x * e.size * 5;
				const py = mouseRef.current.y * e.size * 5;
				ctx.beginPath();
				ctx.arc(e.x + px, e.y + py, e.size, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(${e.color},${e.opacity})`;
				ctx.fill();
			});

			// ── Data streams (horizontal blue streaks) ──
			if (timestamp >= nextStreamRef.current && streams.length < 3) {
				streams.push(spawnStream(w, h));
				nextStreamRef.current = timestamp + 4000 + Math.random() * 8000;
			}

			for (let i = streams.length - 1; i >= 0; i--) {
				const s = streams[i];
				s.x    += s.vx;
				s.life += s.lifeSpeed;
				if (s.life < 0.15)     s.opacity = s.life / 0.15;
				else if (s.life > 0.7) s.opacity = Math.max(0, (1 - s.life) / 0.3);
				else                   s.opacity = 1;
				if (s.life >= 1) { streams.splice(i, 1); continue; }

				const tailX = s.x - s.vx / Math.abs(s.vx) * s.length;
				const grad = ctx.createLinearGradient(s.x, s.y, tailX, s.y);
				grad.addColorStop(0,    `rgba(96,165,250,${s.opacity * 0.7})`);
				grad.addColorStop(0.4,  `rgba(59,130,246,${s.opacity * 0.4})`);
				grad.addColorStop(1,    "rgba(59,130,246,0)");
				ctx.beginPath();
				ctx.moveTo(s.x, s.y);
				ctx.lineTo(tailX, s.y);
				ctx.strokeStyle = grad;
				ctx.lineWidth = 1;
				ctx.stroke();
			}

			rafRef.current = requestAnimationFrame(draw);
		}

		rafRef.current = requestAnimationFrame(draw);

		return () => {
			cancelAnimationFrame(rafRef.current);
			window.removeEventListener("resize", resize);
			window.removeEventListener("mousemove", handleMouseMove);
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
