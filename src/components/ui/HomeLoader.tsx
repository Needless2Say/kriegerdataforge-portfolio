"use client";

import { useEffect, useRef, useState } from "react";
import ForgeCanvas from "./ForgeCanvas";

const STORAGE_KEY = "kdf_loader_v1";
const DISPLAY_MS  = 2800;
const FADE_MS     = 700;

const EMBERS = [
	{ top: "12%", left: "8%",  delay: "0s",   dur: "2.2s" },
	{ top: "20%", left: "80%", delay: "0.5s", dur: "1.8s" },
	{ top: "70%", left: "6%",  delay: "1.0s", dur: "2.5s" },
	{ top: "78%", left: "84%", delay: "0.3s", dur: "2.0s" },
	{ top: "38%", left: "90%", delay: "1.3s", dur: "2.9s" },
	{ top: "55%", left: "4%",  delay: "0.7s", dur: "2.3s" },
	{ top: "6%",  left: "50%", delay: "1.5s", dur: "1.7s" },
	{ top: "88%", left: "46%", delay: "0.4s", dur: "3.1s" },
];

export default function HomeLoader() {
	const [phase, setPhase] = useState<"hidden" | "visible" | "fading">("hidden");
	const fadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (sessionStorage.getItem(STORAGE_KEY)) return;
		setPhase("visible");

		fadeRef.current = setTimeout(() => setPhase("fading"), DISPLAY_MS);
		hideRef.current = setTimeout(() => {
			setPhase("hidden");
			sessionStorage.setItem(STORAGE_KEY, "1");
			window.dispatchEvent(new CustomEvent("loader-done"));
		}, DISPLAY_MS + FADE_MS);

		return () => {
			if (fadeRef.current) clearTimeout(fadeRef.current);
			if (hideRef.current) clearTimeout(hideRef.current);
		};
	}, []);

	function dismiss() {
		if (fadeRef.current) clearTimeout(fadeRef.current);
		if (hideRef.current) clearTimeout(hideRef.current);
		setPhase("fading");
		window.dispatchEvent(new CustomEvent("loader-done"));
		hideRef.current = setTimeout(() => {
			setPhase("hidden");
			sessionStorage.setItem(STORAGE_KEY, "1");
		}, FADE_MS);
	}

	if (phase === "hidden") return null;

	return (
		<div
			onClick={dismiss}
			className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0a0704] cursor-pointer select-none transition-opacity duration-700 ${
				phase === "fading" ? "opacity-0" : "opacity-100"
			}`}
		>
			{/* Scattered background embers */}
			{EMBERS.map((e, i) => (
				<span
					key={i}
					className="absolute w-0.5 h-0.5 rounded-full bg-amber-400"
					style={{
						top: e.top, left: e.left,
						animation: `star-blink ${e.dur} ease-in-out ${e.delay} infinite`,
					}}
				/>
			))}

			{/* Card */}
			<div className="relative flex flex-col items-center rounded-2xl border border-amber-700/25 bg-black/70 px-8 pt-8 pb-7 shadow-[0_0_80px_rgba(245,158,11,0.10)]">
				{/* HUD corners */}
				<span className="pointer-events-none absolute -top-px -left-px  w-4 h-4 border-t-2 border-l-2 rounded-tl-xl border-amber-600/60" />
				<span className="pointer-events-none absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 rounded-tr-xl border-amber-600/60" />
				<span className="pointer-events-none absolute -bottom-px -left-px  w-4 h-4 border-b-2 border-l-2 rounded-bl-xl border-amber-600/60" />
				<span className="pointer-events-none absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 rounded-br-xl border-amber-600/60" />

				<p className="font-mono text-[9px] tracking-[0.45em] uppercase text-amber-500/60 mb-5">
					◈ igniting the forge ◈
				</p>

				{/* Forge animation */}
				<div className="mb-5 w-52 h-44">
					<ForgeCanvas />
				</div>

				{/* Loading bar — dark amber → amber → blue gradient reveal */}
				<div
					className="relative w-48 sm:w-56 h-1 rounded-full overflow-hidden"
					style={{ background: "linear-gradient(90deg, #92400e 0%, #f59e0b 60%, #3b82f6 100%)" }}
				>
					<div
						className="absolute right-0 top-0 h-full bg-[#0a0704]"
						style={{ animation: `forge-bar-mask ${DISPLAY_MS}ms linear forwards` }}
					/>
				</div>

				<p className="mt-3 font-mono text-[10px] tracking-[0.35em] uppercase text-amber-500/50 animate-pulse">
					FORGING DATA...
				</p>
			</div>

			<p className="mt-8 text-slate-700 font-mono text-[10px] tracking-widest uppercase">
				tap anywhere to skip
			</p>
		</div>
	);
}
