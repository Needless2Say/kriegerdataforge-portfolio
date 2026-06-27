"use client";

import { useEffect, useState } from "react";

export default function ScrollToTop() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const check = () => setVisible(window.scrollY > 400);
		window.addEventListener("scroll", check, { passive: true });
		return () => window.removeEventListener("scroll", check);
	}, []);

	if (!visible) return null;

	return (
		<button
			onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
			aria-label="Scroll to top"
			className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-slate-900/80 border border-amber-700/40 text-amber-400 hover:text-amber-300 hover:border-amber-500/60 hover:shadow-[0_0_16px_rgba(245,158,11,0.3)] backdrop-blur-sm transition-all duration-200 flex items-center justify-center"
		>
			<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
				<path d="m18 15-6-6-6 6" />
			</svg>
		</button>
	);
}
