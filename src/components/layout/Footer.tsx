import Link from "next/link";
import { KDF_INFO } from "@/constants/kdf-info";

export default function Footer() {
	return (
		<footer className="relative z-10 mt-20 border-t border-white/5">
			{/* ── Status strip ── */}
			<div className="border-b border-white/5 bg-black/20">
				<div className="max-w-5xl mx-auto px-6 py-2 flex flex-wrap items-center justify-center sm:justify-between gap-x-6 gap-y-1 font-mono text-[10px] tracking-widest uppercase text-slate-600">
					<div className="flex items-center gap-2">
						<span className="relative flex h-1.5 w-1.5">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
							<span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
						</span>
						<span>forge · active</span>
					</div>
					<span className="hidden sm:inline">node · chi-town</span>
					<span className="hidden sm:inline">stack · fastapi + next.js</span>
					<span>est · {KDF_INFO.founded}</span>
				</div>
			</div>

			<div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
				<span className="text-slate-600 text-sm font-mono">
					© {new Date().getFullYear()} KriegerDataForge
				</span>
				<div className="flex items-center gap-6">
					<Link
						href={KDF_INFO.links.github}
						target="_blank"
						rel="noopener noreferrer"
						className="text-slate-500 hover:text-amber-400 transition-colors text-sm"
					>
						GitHub
					</Link>
					<Link
						href={KDF_INFO.links.linkedin}
						target="_blank"
						rel="noopener noreferrer"
						className="text-slate-500 hover:text-amber-400 transition-colors text-sm"
					>
						LinkedIn
					</Link>
					<a
						href={`mailto:${KDF_INFO.links.email}`}
						className="text-slate-500 hover:text-amber-400 transition-colors text-sm"
					>
						Email
					</a>
				</div>
			</div>
		</footer>
	);
}
