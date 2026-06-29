"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { NAV_LINKS } from "@/constants/routes";
import { cn } from "@/utils/cn";

export default function Navbar() {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	const [loaderActive, setLoaderActive] = useState(false);
	const menuKeyRef = useRef(0);

	useEffect(() => {
		if (!sessionStorage.getItem("kdf_loader_v1")) {
			setLoaderActive(true);
			const onDone = () => setLoaderActive(false);
			window.addEventListener("loader-done", onDone);
			return () => window.removeEventListener("loader-done", onDone);
		}
	}, []);

	const isActive = (path: string) =>
		path === "/" ? pathname === "/" : pathname.startsWith(path);

	return (
		<nav className={cn(
			"fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4 transition-opacity duration-700",
			loaderActive ? "opacity-0 pointer-events-none" : "opacity-100"
		)}>
			{/* ── Desktop ── */}
			<div className="hidden sm:flex items-center gap-0.5 rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-amber-900/30 px-2 py-1.5 shadow-xl shadow-black/40">
				{NAV_LINKS.map((link) => (
					<Link
						key={link.name}
						href={link.path}
						className={cn(
							"relative px-4 py-1.5 text-sm font-semibold rounded-full select-none",
							"transition-all duration-200 ease-out",
							"hover:scale-105 active:scale-95",
							isActive(link.path)
								? [
									"text-amber-300 bg-amber-600/20",
									"border border-amber-500/40",
									"shadow-[0_0_12px_rgba(245,158,11,0.3)]",
									"hover:bg-amber-600/30 hover:shadow-[0_0_18px_rgba(245,158,11,0.45)]",
								].join(" ")
								: [
									"text-slate-200 border border-transparent",
									"hover:text-white hover:bg-white/8 hover:border-white/10",
								].join(" ")
						)}
					>
						{link.name}
						{isActive(link.path) && (
							<span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.9)]" />
						)}
					</Link>
				))}
			</div>

			{/* ── Mobile ── */}
			<div className="sm:hidden w-full">
				<div className="flex items-center justify-between rounded-xl bg-slate-900/85 backdrop-blur-xl border border-amber-900/30 px-4 py-3 shadow-xl shadow-black/40">
					<span className="text-amber-400 font-bold font-mono text-sm tracking-widest">
						KDF
					</span>
					<button
						onClick={() => {
							if (!open) menuKeyRef.current += 1;
							setOpen(!open);
						}}
						aria-label="Toggle navigation"
						aria-expanded={open}
						className="flex flex-col gap-1 p-2.5 min-h-[44px] min-w-[44px] items-center justify-center text-slate-200 hover:text-white transition-colors duration-200"
					>
						<span className={cn("block w-5 h-0.5 bg-current transition-all duration-300 origin-center", open && "rotate-45 translate-y-1.5")} />
						<span className={cn("block w-5 h-0.5 bg-current transition-all duration-300", open && "opacity-0 scale-x-0")} />
						<span className={cn("block w-5 h-0.5 bg-current transition-all duration-300 origin-center", open && "-rotate-45 -translate-y-1.5")} />
					</button>
				</div>

				<div className={cn(
					"overflow-hidden transition-all duration-300 ease-out",
					"rounded-xl bg-slate-900/90 backdrop-blur-xl border shadow-xl shadow-black/30",
					open
						? "mt-1 max-h-96 opacity-100 translate-y-0 border-amber-900/30"
						: "max-h-0 opacity-0 -translate-y-2 pointer-events-none border-transparent"
				)}>
					<div key={menuKeyRef.current} className="py-2">
						{NAV_LINKS.map((link, i) => (
							<Link
								key={link.name}
								href={link.path}
								onClick={() => setOpen(false)}
								className={cn(
									"block px-4 py-2.5 text-sm font-semibold select-none",
									"transition-colors duration-200 ease-out active:scale-95",
									"animate-nav-item",
									isActive(link.path)
										? "text-amber-300 bg-amber-600/20"
										: "text-slate-200 hover:text-white hover:bg-white/8"
								)}
								style={{ animationDelay: `${i * 40}ms` }}
							>
								{link.name}
							</Link>
						))}
					</div>
				</div>
			</div>
		</nav>
	);
}
