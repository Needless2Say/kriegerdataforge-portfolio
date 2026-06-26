"use client";

import { useEffect, useRef } from "react";

export default function ScrollProgress() {
	const maskRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const update = () => {
			if (!maskRef.current) return;
			const total = document.documentElement.scrollHeight - window.innerHeight;
			const pct   = total > 0 ? (window.scrollY / total) * 100 : 0;
			maskRef.current.style.width = `${100 - pct}%`;
		};
		window.addEventListener("scroll", update, { passive: true });
		update();
		return () => window.removeEventListener("scroll", update);
	}, []);

	return (
		<div
			className="fixed top-0 left-0 right-0 h-[2px] z-[60] pointer-events-none"
			style={{ background: "linear-gradient(to right, #92400e 0%, #f59e0b 50%, #3b82f6 100%)" }}
		>
			<div
				ref={maskRef}
				className="absolute right-0 top-0 h-full"
				style={{ width: "100%", backgroundColor: "#0a0704" }}
			/>
		</div>
	);
}
