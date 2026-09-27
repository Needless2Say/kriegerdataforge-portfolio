import type { Metadata } from "next";
import { ROUTES, hrefFor } from "@/constants/routes";
import { KDF_INFO, STATS } from "@/constants/kdf-info";
import { KDF_PROJECTS } from "@/constants/projects";
import HomeLoader from "@/components/ui/HomeLoader";
import HomeContentReveal from "@/components/ui/HomeContentReveal";
import TypewriterText from "@/components/ui/TypewriterText";
import TechBadge from "@/components/ui/TechBadge";
import StatusPill from "@/components/ui/StatusPill";
import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";
import SectionHeader from "@/components/ui/SectionHeader";
import StruckWordmark from "@/components/ui/StruckWordmark";
import BinaryStat from "@/components/ui/BinaryStat";
import SpaceLink from "@/components/ui/SpaceLink";

export const metadata: Metadata = {
	title: "KriegerDataForge | A Personal Platform",
	description: KDF_INFO.description,
	alternates: { canonical: "https://kriegerdataforge.com" },
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
					◈ a work in progress ◈
				</p>

				{/*
					One h1 holding one continuous word. `clamp` rather than breakpoint
					steps because the name is 16 characters on a single unbreakable
					line, so the size has to track the viewport continuously or it
					overflows somewhere between two breakpoints. The upper bound is set
					by the 768px container it sits in, not by taste.
				*/}
				<StruckWordmark
					className="brand-wordmark font-bold leading-[1.08] tracking-tight whitespace-nowrap mb-5 pb-2 animate-fade-in-up"
					style={{ animationDelay: "0.1s", fontSize: "clamp(1.85rem, 8.2vw, 4.6rem)" }}
				>
					KriegerDataForge
				</StruckWordmark>

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
							<BinaryStat value={stat.value} className="text-amber-300 font-bold text-sm font-mono" />
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
						{KDF_INFO.access}
					</span>
				</div>

				{/* CTAs */}
				<div
					className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-7 animate-fade-in-up"
					style={{ animationDelay: "0.55s" }}
				>
					<a
						href={hrefFor(ROUTES.PROJECTS)}
						className="px-8 py-3 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-all duration-300 hover:shadow-[0_0_24px_rgba(245,158,11,0.5)] w-full sm:w-auto text-center text-sm"
					>
						What I&apos;m Building
					</a>
					<a
						href={hrefFor(ROUTES.ABOUT)}
						className="px-8 py-3 rounded-full border border-white/15 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 font-semibold transition-all duration-300 w-full sm:w-auto text-center text-sm"
					>
						About the Platform
					</a>
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

		{/* ── In the forge ── */}
		<div className="pb-24 pt-4 px-4">
			<div className="max-w-4xl mx-auto">
				<Reveal>
					<SectionHeader
						title="In the Forge"
						eyebrow="on the bench"
						subtitle="// the platform, and the apps I am building on it"
					/>
				</Reveal>

				<div className="grid sm:grid-cols-2 gap-4">
					{KDF_PROJECTS.slice(0, 4).map((project, i) => (
						<Reveal key={project.id} delay={i * 80}>
							<Card glow="amber" className="h-full flex flex-col">
								<div className="flex items-start justify-between gap-2 mb-3">
									<span className="text-slate-600 font-mono text-[10px] tracking-widest uppercase">
										{project.category}
									</span>
									<StatusPill status={project.status} />
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
						<a
							href={hrefFor(ROUTES.PROJECTS)}
							className="tap-pad text-amber-400 hover:text-amber-300 font-mono text-sm tracking-wider transition-colors duration-200"
						>
							see everything →
						</a>
					</div>
				</Reveal>
			</div>
		</div>

		{/* ── Why it exists ── */}
		<div className="pb-28 px-4">
			<div className="max-w-3xl mx-auto">
				<Reveal>
					<div className="glass-card border-amber-700/20 p-8 text-center">
						<p className="text-amber-500/60 font-mono text-[10px] tracking-[0.4em] uppercase mb-4">
							◈ why it exists ◈
						</p>
						<p className="text-slate-200 text-lg leading-relaxed">
							{KDF_INFO.why}
						</p>
						<div className="mt-5 h-px animate-gradient-line" />
						<p className="mt-4 text-slate-500 font-mono text-xs">
							— {KDF_INFO.founder}, Founder
						</p>
						<div className="mt-4 flex justify-center">
							<SpaceLink href={KDF_INFO.links.portfolio} size="sm">
								My Personal Portfolio
							</SpaceLink>
						</div>
					</div>
				</Reveal>
			</div>
		</div>
		</HomeContentReveal>
		</>
	);
}