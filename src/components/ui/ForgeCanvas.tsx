"use client";

import { useEffect, useRef } from "react";

interface BinarySpark {
	x: number;
	y: number;
	vx: number;
	vy: number;
	char: string;
	opacity: number;
	size: number;
	color: string;
	life: number;     // 0→1
	lifeSpeed: number;
}

interface Ember {
	x: number;
	y: number;
	vx: number;
	vy: number;
	opacity: number;
	size: number;
	life: number;
	lifeSpeed: number;
}

type HammerPhase = "waiting" | "swinging" | "struck" | "recovering";

const AMBER  = "#f59e0b";
const ORANGE = "#fb923c";
const BLUE   = "#60a5fa";

function lerp(a: number, b: number, t: number) {
	return a + (b - a) * t;
}

function easeIn(t: number) {
	return t * t * t;
}

function easeOut(t: number) {
	return 1 - Math.pow(1 - t, 3);
}

export default function ForgeCanvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d")!;

		let W = 0, H = 0;
		let anvilX = 0, anvilY = 0;
		let raf = 0;

		// ── Hammer state ───────────────────────────────
		let phase: HammerPhase = "waiting";
		let phaseProgress = 0; // 0→1
		const PHASE_SPEEDS: Record<HammerPhase, number> = {
			waiting:    0.004,   // slow wait
			swinging:   0.038,   // fast swing
			struck:     0.12,    // very brief flash
			recovering: 0.022,   // moderate rise
		};

		// ── Particle pools ──────────────────────────────
		const sparks: BinarySpark[] = [];
		const embers: Ember[] = [];
		let impactFlash = 0; // 0→1, fades quickly after strike

		// ── Anvil glow pulse ────────────────────────────
		let glowPulse = 0;

		function spawnSparks(cx: number, cy: number) {
			const count = 18 + Math.floor(Math.random() * 12);
			for (let i = 0; i < count; i++) {
				const angle = Math.random() * Math.PI * 2;
				const speed = 2.5 + Math.random() * 4.5;
				const isBlue = Math.random() < 0.25;
				sparks.push({
					x: cx,
					y: cy,
					vx: Math.cos(angle) * speed,
					vy: Math.sin(angle) * speed - 1.5, // bias upward
					char: Math.random() > 0.5 ? "1" : "0",
					opacity: 1,
					size: 9 + Math.floor(Math.random() * 8),
					color: isBlue ? BLUE : (Math.random() > 0.5 ? AMBER : ORANGE),
					life: 0,
					lifeSpeed: 0.015 + Math.random() * 0.02,
				});
			}
		}

		function spawnAmbientEmber() {
			if (embers.length > 40) return;
			const side = Math.random() < 0.5 ? -1 : 1;
			embers.push({
				x: anvilX + (Math.random() - 0.5) * 80,
				y: anvilY - 10,
				vx: (Math.random() - 0.5) * 0.6 + side * 0.3,
				vy: -(0.4 + Math.random() * 0.8),
				opacity: 0,
				size: 1.5 + Math.random() * 2,
				life: 0,
				lifeSpeed: 0.008 + Math.random() * 0.008,
			});
		}

		const cv = canvas; // narrow once for closures
		function resize() {
			W = cv.width  = cv.offsetWidth;
			H = cv.height = cv.offsetHeight;
			anvilX = W * 0.5;
			anvilY = H * 0.62;
		}
		resize();
		window.addEventListener("resize", resize);

		// ── Drawing helpers ─────────────────────────────

		function drawAnvil(cx: number, cy: number) {
			// Ambient forge glow beneath the anvil
			const glow = ctx.createRadialGradient(cx, cy + 25, 0, cx, cy + 25, 110);
			glow.addColorStop(0,   `rgba(245,158,11,${0.12 + glowPulse * 0.06})`);
			glow.addColorStop(0.5, `rgba(251,146,60,${0.06 + glowPulse * 0.03})`);
			glow.addColorStop(1,   "rgba(0,0,0,0)");
			ctx.fillStyle = glow;
			ctx.beginPath();
			ctx.ellipse(cx, cy + 25, 110, 55, 0, 0, Math.PI * 2);
			ctx.fill();

			// Stand / base
			const baseGrad = ctx.createLinearGradient(cx - 22, cy, cx + 22, cy);
			baseGrad.addColorStop(0, "#1c1a16");
			baseGrad.addColorStop(0.5, "#2a2720");
			baseGrad.addColorStop(1, "#1c1a16");
			ctx.fillStyle = baseGrad;
			ctx.beginPath();
			ctx.moveTo(cx - 22, cy);
			ctx.lineTo(cx + 22, cy);
			ctx.lineTo(cx + 30, cy + 38);
			ctx.lineTo(cx - 30, cy + 38);
			ctx.closePath();
			ctx.fill();

			// Base plate
			const plateGrad = ctx.createLinearGradient(cx - 50, cy + 38, cx + 50, cy + 38);
			plateGrad.addColorStop(0, "#181510");
			plateGrad.addColorStop(0.5, "#302b20");
			plateGrad.addColorStop(1, "#181510");
			ctx.fillStyle = plateGrad;
			ctx.beginPath();
			ctx.moveTo(cx - 50, cy + 38);
			ctx.lineTo(cx + 50, cy + 38);
			ctx.lineTo(cx + 46, cy + 50);
			ctx.lineTo(cx - 46, cy + 50);
			ctx.closePath();
			ctx.fill();

			// Main body
			const bodyGrad = ctx.createLinearGradient(cx - 58, cy - 22, cx + 58, cy - 22);
			bodyGrad.addColorStop(0, "#1e1b14");
			bodyGrad.addColorStop(0.4, "#3a342a");
			bodyGrad.addColorStop(0.6, "#3a342a");
			bodyGrad.addColorStop(1, "#1e1b14");
			ctx.fillStyle = bodyGrad;
			ctx.beginPath();
			ctx.moveTo(cx - 52, cy - 22);
			ctx.lineTo(cx + 52, cy - 22);
			ctx.lineTo(cx + 28, cy);
			ctx.lineTo(cx - 28, cy);
			ctx.closePath();
			ctx.fill();

			// Horn (left protrusion)
			ctx.fillStyle = "#2a2520";
			ctx.beginPath();
			ctx.moveTo(cx - 52, cy - 22);
			ctx.lineTo(cx - 78, cy - 10);
			ctx.lineTo(cx - 52, cy - 5);
			ctx.closePath();
			ctx.fill();

			// Top working face — hot metal glow
			const hotIntensity = 0.7 + glowPulse * 0.3;
			const faceGrad = ctx.createLinearGradient(cx - 58, cy - 30, cx + 58, cy - 30);
			faceGrad.addColorStop(0,   `rgba(120,60,0,${hotIntensity})`);
			faceGrad.addColorStop(0.2, `rgba(220,100,20,${hotIntensity})`);
			faceGrad.addColorStop(0.5, `rgba(251,146,60,${hotIntensity})`);
			faceGrad.addColorStop(0.8, `rgba(220,100,20,${hotIntensity})`);
			faceGrad.addColorStop(1,   `rgba(120,60,0,${hotIntensity})`);
			ctx.fillStyle = faceGrad;
			ctx.beginPath();
			ctx.roundRect(cx - 58, cy - 30, 116, 8, 2);
			ctx.fill();

			// Data block on the face (the "hot metal being forged")
			const dataW = 72, dataH = 14;
			const dataGrad = ctx.createLinearGradient(cx - dataW / 2, cy - 52, cx + dataW / 2, cy - 38);
			dataGrad.addColorStop(0,   `rgba(245,158,11,${0.8 + glowPulse * 0.2})`);
			dataGrad.addColorStop(0.3, `rgba(251,191,36,${0.9 + glowPulse * 0.1})`);
			dataGrad.addColorStop(0.7, `rgba(253,186,116,${0.85})`);
			dataGrad.addColorStop(1,   `rgba(245,158,11,${0.8 + glowPulse * 0.2})`);
			ctx.fillStyle = dataGrad;
			ctx.beginPath();
			ctx.roundRect(cx - dataW / 2, cy - 44, dataW, dataH, 2);
			ctx.fill();

			// Glow around data block
			const dGlow = ctx.createRadialGradient(cx, cy - 37, 0, cx, cy - 37, 55);
			dGlow.addColorStop(0,   `rgba(251,191,36,${0.35 + glowPulse * 0.2})`);
			dGlow.addColorStop(0.5, `rgba(245,158,11,${0.12})`);
			dGlow.addColorStop(1,   "rgba(0,0,0,0)");
			ctx.fillStyle = dGlow;
			ctx.beginPath();
			ctx.ellipse(cx, cy - 37, 55, 30, 0, 0, Math.PI * 2);
			ctx.fill();

			// Binary label on the data block
			ctx.font = "bold 8px monospace";
			ctx.fillStyle = `rgba(120,60,0,${0.9 + glowPulse * 0.1})`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText("01 DATA 10", cx, cy - 37);
		}

		function getHammerTransform(): { x: number; y: number; angle: number } {
			// Raised: upper-right of anvil
			const raisedX = anvilX + 40;
			const raisedY = anvilY - 115;
			const raisedAngle = -0.45;

			// Struck: hammer head touching anvil face
			const struckX = anvilX + 5;
			const struckY = anvilY - 68;
			const struckAngle = 0.25;

			switch (phase) {
				case "waiting": {
					// Slight breathing wobble
					const wobble = Math.sin(phaseProgress * Math.PI * 8) * 0.015;
					return { x: raisedX, y: raisedY + Math.sin(phaseProgress * Math.PI * 4) * 3, angle: raisedAngle + wobble };
				}
				case "swinging": {
					const t = easeIn(phaseProgress);
					return {
						x: lerp(raisedX, struckX, t),
						y: lerp(raisedY, struckY, t),
						angle: lerp(raisedAngle, struckAngle, t),
					};
				}
				case "struck": {
					const bounce = Math.sin(phaseProgress * Math.PI) * 4;
					return { x: struckX, y: struckY - bounce, angle: struckAngle };
				}
				case "recovering": {
					const t = easeOut(phaseProgress);
					return {
						x: lerp(struckX, raisedX, t),
						y: lerp(struckY, raisedY, t),
						angle: lerp(struckAngle, raisedAngle, t),
					};
				}
			}
		}

		function drawHammer(hx: number, hy: number, angle: number) {
			ctx.save();
			ctx.translate(hx, hy);
			ctx.rotate(angle);

			// Handle
			const handleGrad = ctx.createLinearGradient(-5, 0, 5, 0);
			handleGrad.addColorStop(0, "#3a2e1a");
			handleGrad.addColorStop(0.5, "#6b5030");
			handleGrad.addColorStop(1, "#3a2e1a");
			ctx.fillStyle = handleGrad;
			ctx.beginPath();
			ctx.roundRect(-4, 0, 8, 70, 2);
			ctx.fill();

			// Head
			const headGrad = ctx.createLinearGradient(-18, -28, 18, -8);
			headGrad.addColorStop(0, "#2a2520");
			headGrad.addColorStop(0.3, "#52463a");
			headGrad.addColorStop(0.7, "#6a5a48");
			headGrad.addColorStop(1, "#2a2520");
			ctx.fillStyle = headGrad;
			ctx.beginPath();
			ctx.roundRect(-18, -28, 36, 20, 3);
			ctx.fill();

			// Head edge (strike face)
			ctx.fillStyle = "#8a7a6a";
			ctx.beginPath();
			ctx.roundRect(-16, -10, 32, 4, 1);
			ctx.fill();

			// Metal glint on head
			ctx.fillStyle = "rgba(255,255,255,0.08)";
			ctx.beginPath();
			ctx.roundRect(-14, -26, 20, 5, 1);
			ctx.fill();

			ctx.restore();
		}

		// ── Main render loop ────────────────────────────
		let lastTime = 0;
		let nextEmberTime = 0;

		function draw(timestamp: number) {
			const dt = timestamp - lastTime;
			lastTime = timestamp;

			ctx.clearRect(0, 0, W, H);

			// Advance glow pulse
			glowPulse = (Math.sin(timestamp * 0.001) + 1) / 2;

			// Spawn ambient embers
			if (timestamp > nextEmberTime) {
				spawnAmbientEmber();
				nextEmberTime = timestamp + 120 + Math.random() * 200;
			}

			// ── Advance hammer phase ──
			phaseProgress += PHASE_SPEEDS[phase];
			if (phaseProgress >= 1) {
				phaseProgress = 0;
				const next: HammerPhase =
					phase === "waiting"    ? "swinging"   :
					phase === "swinging"   ? "struck"     :
					phase === "struck"     ? "recovering" :
					"waiting";

				if (phase === "swinging") {
					// Just hit — spawn sparks and flash
					const { x: hx, y: hy } = getHammerTransform();
					spawnSparks(hx + 5, hy + 8);
					impactFlash = 1;
				}
				phase = next;
			}

			// Fade impact flash
			impactFlash = Math.max(0, impactFlash - 0.06);

			// ── Draw embers ──
			for (let i = embers.length - 1; i >= 0; i--) {
				const e = embers[i];
				e.x  += e.vx;
				e.y  += e.vy;
				e.vy -= 0.005; // drift upward faster over time
				e.life += e.lifeSpeed;

				if (e.life < 0.15)      e.opacity = e.life / 0.15;
				else if (e.life > 0.7)  e.opacity = Math.max(0, (1 - e.life) / 0.3);
				else                    e.opacity = 0.7 + Math.random() * 0.3;

				if (e.life >= 1) { embers.splice(i, 1); continue; }

				const emberColor = Math.random() > 0.6 ? "245,158,11" : "251,146,60";
				ctx.beginPath();
				ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(${emberColor},${e.opacity})`;
				ctx.fill();
			}

			// ── Draw anvil ──
			drawAnvil(anvilX, anvilY);

			// ── Draw sparks ──
			for (let i = sparks.length - 1; i >= 0; i--) {
				const s = sparks[i];
				s.x  += s.vx;
				s.y  += s.vy;
				s.vy += 0.18; // gravity
				s.vx *= 0.98; // drag
				s.life += s.lifeSpeed;
				s.opacity = Math.max(0, 1 - easeIn(s.life));
				if (s.life >= 1 || s.opacity <= 0) { sparks.splice(i, 1); continue; }

				// Glow
				const glowR = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 2.5);
				glowR.addColorStop(0, s.color.replace("#", "rgba(").replace(/(..)(..)(..)/, (_, r, g, b) =>
					`${parseInt(r, 16)},${parseInt(g, 16)},${parseInt(b, 16)}`
				) + `,${s.opacity * 0.4})`);
				glowR.addColorStop(1, "rgba(0,0,0,0)");

				ctx.beginPath();
				ctx.arc(s.x, s.y, s.size * 2.5, 0, Math.PI * 2);
				ctx.fillStyle = glowR;
				ctx.fill();

				// Character
				ctx.font = `bold ${s.size}px monospace`;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillStyle = s.color + Math.round(s.opacity * 255).toString(16).padStart(2, "0");
				ctx.shadowColor = s.color;
				ctx.shadowBlur = 8;
				ctx.fillText(s.char, s.x, s.y);
				ctx.shadowBlur = 0;
			}

			// ── Draw hammer ──
			const { x: hx, y: hy, angle: ha } = getHammerTransform();
			drawHammer(hx, hy, ha);

			// ── Impact flash overlay ──
			if (impactFlash > 0) {
				const flashGrad = ctx.createRadialGradient(anvilX, anvilY - 37, 0, anvilX, anvilY - 37, 120);
				flashGrad.addColorStop(0,   `rgba(255,220,100,${impactFlash * 0.55})`);
				flashGrad.addColorStop(0.4, `rgba(245,158,11,${impactFlash * 0.25})`);
				flashGrad.addColorStop(1,   "rgba(0,0,0,0)");
				ctx.fillStyle = flashGrad;
				ctx.beginPath();
				ctx.ellipse(anvilX, anvilY - 37, 120, 70, 0, 0, Math.PI * 2);
				ctx.fill();
			}

			void dt;
			raf = requestAnimationFrame(draw);
		}

		raf = requestAnimationFrame(draw);

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
