"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { useRevisit } from "@/utils/useRevisit";

interface RevealProps {
	children: React.ReactNode;
	className?: string;
	delay?: number;
}

/*
	Content that rises into place as it scrolls into view, on a page's first
	load in a tab. On a return visit the page is drawn finished, so there is
	nothing to reveal. The stylesheet keeps it visible from the first paint,
	before React has loaded, and this then renders it plainly.
*/
export default function Reveal({ children, className, delay = 0 }: RevealProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);
	const revisit = useRevisit();

	useEffect(() => {
		const el = ref.current;
		if (!el || revisit) return;
		const observer = new IntersectionObserver(
			([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
			{ threshold: 0.12 }
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [revisit]);

	let style: React.CSSProperties | undefined;
	if (!revisit) {
		style = visible ? { animation: `warp-in 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms both` } : { opacity: 0 };
	}

	return (
		<div ref={ref} data-reveal className={cn(className)} style={style}>
			{children}
		</div>
	);
}
