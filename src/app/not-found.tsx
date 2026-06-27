import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
			<p className="text-amber-500/60 font-mono text-[10px] tracking-[0.4em] uppercase mb-4">
				◈ 404 · forge error ◈
			</p>
			<h1 className="text-6xl font-bold gradient-text glow-text pb-2 mb-4">Lost in the slag</h1>
			<p className="text-slate-400 text-base mb-8 max-w-md">
				This page got melted down and recycled. Let&apos;s forge a path back.
			</p>
			<Link
				href={ROUTES.HOME}
				className="px-6 py-2.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
			>
				Back to the Forge
			</Link>
		</div>
	);
}
