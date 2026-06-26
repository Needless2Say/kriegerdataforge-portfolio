"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";

interface RevealProps {
	children: React.ReactNode;
	className?: string;
	delay?: number;
}

export default function Reveal({ children, className, delay = 0 }: RevealProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const observer = new IntersectionObserver(
			([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
			{ threshold: 0.12 }
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			ref={ref}
			className={cn(className)}
			style={visible ? { animation: `warp-in 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms both` } : { opacity: 0 }}
		>
			{children}
		</div>
	);
}
