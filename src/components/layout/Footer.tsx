import Link from "next/link";
import { KDF_INFO } from "@/constants/kdf-info";
import EmailModal from "@/components/ui/EmailModal";
import SpaceLink from "@/components/ui/SpaceLink";

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
						<span>forge · personal</span>
					</div>
					<span className="hidden sm:inline">repos · 18</span>
					<span className="hidden sm:inline">stack · fastapi + next.js</span>
					<span>building · since {KDF_INFO.since}</span>
				</div>
			</div>

			<div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
				{/*
					The copyright sits on the person rather than on the brand. A
					brand-only copyright line reads like an entity, and the second line
					is the one that matters, a platform for myself.
				*/}
				<div className="text-center sm:text-left">
					<p className="text-slate-600 text-sm font-mono">
						© {new Date().getFullYear()} {KDF_INFO.founder}
					</p>
					<p className="text-slate-700 text-xs font-mono mt-1">
						A platform for myself, running all of my own personal apps.
					</p>
				</div>
				<div className="flex items-center gap-6">
					<Link
						href={KDF_INFO.links.github}
						target="_blank"
						rel="noopener noreferrer"
						className="tap-pad inline-block min-w-[44px] text-center text-slate-500 hover:text-amber-400 transition-colors text-sm"
					>
						GitHub
					</Link>
					<Link
						href={KDF_INFO.links.linkedin}
						target="_blank"
						rel="noopener noreferrer"
						className="tap-pad inline-block min-w-[44px] text-center text-slate-500 hover:text-amber-400 transition-colors text-sm"
					>
						LinkedIn
					</Link>
					<EmailModal
						email={KDF_INFO.links.email}
						className="tap-pad inline-block min-w-[44px] text-center text-slate-500 hover:text-amber-400 transition-colors text-sm cursor-pointer"
					>
						Email
					</EmailModal>
					<SpaceLink href={KDF_INFO.links.portfolio} size="sm">
						Portfolio
					</SpaceLink>
				</div>
			</div>
		</footer>
	);
}
