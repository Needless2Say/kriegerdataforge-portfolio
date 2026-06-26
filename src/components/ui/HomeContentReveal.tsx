"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "kdf_loader_v1";
const REVEAL_MS   = 2800 + 700 + 0; // DISPLAY_MS + FADE_MS

export default function HomeContentReveal({ children }: { children: React.ReactNode }) {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (sessionStorage.getItem(STORAGE_KEY)) {
			setVisible(true);
			return;
		}
		const t = setTimeout(() => setVisible(true), REVEAL_MS);
		const onDone = () => { clearTimeout(t); setVisible(true); };
		window.addEventListener("loader-done", onDone);
		return () => { clearTimeout(t); window.removeEventListener("loader-done", onDone); };
	}, []);

	return (
		<div className={`transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}>
			{children}
		</div>
	);
}
