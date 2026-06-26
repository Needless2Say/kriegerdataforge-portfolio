import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { KDF_INFO, STATS } from "@/constants/kdf-info";
import { KDF_PROJECTS } from "@/constants/projects";
import HomeLoader from "@/components/ui/HomeLoader";
import HomeContentReveal from "@/components/ui/HomeContentReveal";
import TypewriterText from "@/components/ui/TypewriterText";
import TechBadge from "@/components/ui/TechBadge";
import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";
import SectionHeader from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
	title: "KriegerDataForge | Data Engineering & Full-Stack Platform",
	description: KDF_INFO.description,
	alternates: { canonical: "https://needless2say.github.io/kriegerdataforge-portfolio" },
};

export default function Home() {
	return (
		<>
		<HomeLoader />

		<HomeContentReveal>
		<div className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-8">
			<div className="text-center max-w-3xl mx-auto">

				{/* Eyebrow */}
				<p
					className="text-amber-500/70 font-mono text-xs tracking-[0.3em] uppercase mb-6 animate-fade-in"
					style={{ animationDelay: "0s" }}
				>
					◈ Chicago, IL · Est. {KDF_INFO.founded} ◈
				</p>

				{/* Brand name */}
				<h1
					className="text-5xl sm:text-6xl md:text-7xl font-bold text-white glow-text leading-tight mb-2 pb-2 animate-fade-in-up"
					style={{ animationDelay: "0.1s" }}
				>
					Krieger
				</h1>
				<h1
					className="text-5xl sm:text-6xl md:text-7xl font-bold forge-gradient-text leading-tight mb-5 pb-2 animate-fade-in-up"
					style={{ animationDelay: "0.2s" }}
				>
					DataForge
				</h1>

				{/* Typewriter */}
				<p
					className="text-amber-300/80 font-mono text-sm tracking-wider mb-4 h-5 animate-fade-in"
					style={{ animationDelay: "0.25s" }}
				>
					<TypewriterText />
				</p>

				{/* Tagline */}
				<p
					className="text-slate-300 text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-7 animate-fade-in-up"
					style={{ animationDelay: "0.35s" }}
				>
					{KDF_INFO.tagline}
				</p>

				{/* Stats */}
				<div
					className="flex flex-wrap items-center justify-center gap-2 mb-5 animate-fade-in"
					style={{ animationDelay: "0.45s" }}
				>
					{STATS.map((stat) => (
						<div key={stat.label} className="glass-card px-4 py-1.5 border-white/5 flex items-center gap-1.5">
							<span className="text-amber-300 font-bold text-sm font-mono">{stat.value}</span>
							<span className="text-slate-500 text-xs">{stat.label}</span>
						</div>
					))}
				</div>

				{/* Status badge */}
				<div
					className="flex items-center justify-center gap-2 mb-9 animate-fade-in"
					style={{ animationDelay: "0.5s" }}
				>
					<span className="relative flex h-2 w-2">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
						<span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
					</span>
					<span className="text-slate-400 text-xs font-mono">
						Forge active — {KDF_INFO.location}
					</span>
				</div>

				{/* CTAs */}
				<div
					className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-7 animate-fade-in-up"
					style={{ animationDelay: "0.55s" }}
				>
					<Link
						href={ROUTES.PROJECTS}
						className="px-8 py-3 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-all duration-300 hover:shadow-[0_0_24px_rgba(245,158,11,0.5)] w-full sm:w-auto text-center text-sm"
					>
						View Projects
					</Link>
					<Link
						href={ROUTES.ABOUT}
						className="px-8 py-3 rounded-full border border-white/15 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 font-semibold transition-all duration-300 w-full sm:w-auto text-center text-sm"
					>
						About KDF
					</Link>
				</div>

				{/* Scroll indicator */}
				<div
					className="flex flex-col items-center gap-2 animate-fade-in"
					style={{ animationDelay: "0.8s" }}
				>
					<span className="text-slate-600 font-mono text-xs tracking-widest">scroll</span>
					<div className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center pt-1.5 animate-pulse-glow">
						<div className="w-0.5 h-1.5 rounded-full bg-amber-500 animate-float" />
					</div>
				</div>
			</div>
		</div>

		{/* ── Featured Projects ── */}
		<div className="pb-24 pt-4 px-4">
			<div className="max-w-4xl mx-auto">
				<Reveal>
					<SectionHeader
						title="Active Forges"
						eyebrow="current builds"
						subtitle="// projects running on the KDF platform"
					/>
				</Reveal>

				<div className="grid sm:grid-cols-2 gap-4">
					{KDF_PROJECTS.slice(0, 4).map((project, i) => (
						<Reveal key={project.id} delay={i * 80}>
							<Card glow="amber" className="h-full flex flex-col">
								<div className="flex items-start justify-between mb-3">
									<span className="text-slate-600 font-mono text-[10px] tracking-widest uppercase">
										{project.category}
									</span>
									<span className={`font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${
										project.status === "active"
											? "text-amber-300 border-amber-600/40 bg-amber-950/40"
											: project.status === "beta"
											? "text-blue-300 border-blue-600/40 bg-blue-950/40"
											: "text-slate-400 border-slate-600/40 bg-slate-900/40"
									}`}>
										{project.status}
									</span>
								</div>
								<h3 className="text-white font-bold text-base mb-2">{project.title}</h3>
								<p className="text-slate-400 text-sm leading-relaxed mb-4 flex-grow">{project.description}</p>
								<div className="flex flex-wrap gap-1.5">
									{project.tech.slice(0, 4).map(t => (
										<TechBadge key={t} label={t} color={project.color} />
									))}
								</div>
							</Card>
						</Reveal>
					))}
				</div>

				<Reveal delay={300}>
					<div className="text-center mt-8">
						<Link
							href={ROUTES.PROJECTS}
							className="text-amber-400 hover:text-amber-300 font-mono text-sm tracking-wider transition-colors duration-200"
						>
							view all projects →
						</Link>
					</div>
				</Reveal>
			</div>
		</div>

		{/* ── Mission statement ── */}
		<div className="pb-28 px-4">
			<div className="max-w-3xl mx-auto">
				<Reveal>
					<div className="glass-card border-amber-700/20 p-8 text-center">
						<p className="text-amber-500/60 font-mono text-[10px] tracking-[0.4em] uppercase mb-4">
							◈ the mission ◈
						</p>
						<p className="text-slate-200 text-lg leading-relaxed italic">
							&ldquo;{KDF_INFO.mission}&rdquo;
						</p>
						<div className="mt-5 h-px animate-gradient-line" />
						<p className="mt-4 text-slate-500 font-mono text-xs">
							— {KDF_INFO.founder}, Founder
						</p>
					</div>
				</Reveal>
			</div>
		</div>
		</HomeContentReveal>
		</>
	);
}
