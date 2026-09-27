import type { Metadata } from "next";
import Link from "next/link";
import { KDF_INFO } from "@/constants/kdf-info";
import { SKILL_GROUPS } from "@/constants/skills";
import SectionHeader from "@/components/ui/SectionHeader";
import TechBadge from "@/components/ui/TechBadge";
import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";
import ForgedHeading from "@/components/ui/ForgedHeading";
import PourTimeline from "@/components/ui/PourTimeline";
import SpaceLink from "@/components/ui/SpaceLink";

export const metadata: Metadata = {
	title: "About",
	description: "What KriegerDataForge is. A personal platform Arthur Krieger builds and uses for his own apps.",
	alternates: { canonical: "https://kriegerdataforge.com/about" },
};

/*
	The history of the platform, not a career timeline. Nothing here reaches
	outside the platform itself. No roles, no organisations, and nothing about
	how the owner spends his days, all of which belongs on the personal
	portfolio rather than on this site.
*/
const MILESTONES = [
	{
		year: "2024",
		title: "The first app",
		desc: "Started a nutrition tracker and noticed a problem every later app would have too. Each one would need its own sign in, database setup, and deploy pipeline, written from scratch every time.",
	},
	{
		year: "2024",
		title: "One sign in for every app",
		desc: "Built an OAuth 2.0 and OIDC identity provider so every app shares one account and one sign in, instead of each one growing its own.",
	},
	{
		year: "2025",
		title: "Shared foundations",
		desc: "Pulled the repeated parts out into a shared Python SDK every backend installs, a Terraform setup that declares every environment, and a CI/CD library every repository inherits.",
	},
	{
		year: "2026 →",
		title: "Apps on top",
		desc: "It spans 18 repositories now. A boutique storefront for my sister and the nutrition tracker are the two apps being built on it, with a game catalog planned after them.",
	},
];

export default function About() {
	return (
		<div className="min-h-screen pt-24 pb-16 px-4">
			<div className="max-w-4xl mx-auto">

				{/* ── Hero ── */}
				<Reveal className="mb-16">
					<div className="text-center max-w-2xl mx-auto">
						<p className="text-amber-500/60 font-mono text-[10px] tracking-[0.4em] uppercase mb-3">
							◈ the forge origin ◈
						</p>
						<ForgedHeading as="h1" className="text-4xl sm:text-5xl font-bold gradient-text glow-text pb-2 mb-4">
							What is KDF?
						</ForgedHeading>
						<p className="text-slate-300 text-base leading-relaxed">
							{KDF_INFO.description}
						</p>
					</div>
				</Reveal>

				{/* ── Why it exists ── */}
				<Reveal className="mb-16">
					<div className="glass-card border-amber-700/20 p-7 text-center">
						<p className="text-amber-500/60 font-mono text-[10px] tracking-[0.4em] uppercase mb-3">◈ why it exists ◈</p>
						<p className="text-slate-200 text-base leading-relaxed max-w-2xl mx-auto">
							{KDF_INFO.why}
						</p>
					</div>
				</Reveal>

				{/* ── The Blacksmith ── */}
				<section className="mb-16">
					<Reveal>
						<SectionHeader
							title="The Blacksmith"
							eyebrow="founder"
							subtitle="// the person behind the forge"
						/>
					</Reveal>

					<Reveal delay={60}>
						<Card glow="amber">
							<div className="flex flex-col sm:flex-row gap-6 items-start">
								<div className="flex-shrink-0">
									<div className="w-16 h-16 rounded-xl bg-amber-950/60 border border-amber-700/30 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.15)]">
										<span className="text-amber-400 font-bold font-mono text-xl">AK</span>
									</div>
								</div>
								<div className="flex-grow">
									<h3 className="text-white font-bold text-lg mb-0.5">{KDF_INFO.founder}</h3>
									<p className="text-amber-400 text-sm font-mono mb-3">Founder · Builds and maintains it</p>
									<p className="text-slate-300 text-sm leading-relaxed mb-4">
										I studied Computer Science and Data Science at the University of Michigan and graduated in 2025. KriegerDataForge is a personal project I design and build, and I use it for all of my apps.
									</p>
									<div className="flex flex-wrap items-center gap-3 mb-4">
										<Link
											href={KDF_INFO.links.github}
											target="_blank"
											rel="noopener noreferrer"
											className="tap-pad text-slate-400 hover:text-amber-300 font-mono text-xs transition-colors duration-200"
										>
											GitHub →
										</Link>
										<span className="text-slate-700">·</span>
										<Link
											href={KDF_INFO.links.linkedin}
											target="_blank"
											rel="noopener noreferrer"
											className="tap-pad text-slate-400 hover:text-amber-300 font-mono text-xs transition-colors duration-200"
										>
											LinkedIn →
										</Link>
									</div>
									<SpaceLink href={KDF_INFO.links.portfolio}>
										Visit My Personal Portfolio
									</SpaceLink>
								</div>
							</div>
						</Card>
					</Reveal>
				</section>

				{/* ── Timeline ── */}
				<section className="mb-16">
					<Reveal>
						<SectionHeader
							title="Forge History"
							eyebrow="timeline"
							subtitle="// how the platform got here"
						/>
					</Reveal>

					<PourTimeline>
						<div className="space-y-4">
							{MILESTONES.map((m, i) => (
								<Reveal key={i} className="relative pl-12" delay={i * 80}>
									<div data-pour-dot className="pour-dot absolute left-3 top-5 -translate-x-1/2 w-3.5 h-3.5 rounded-full flex items-center justify-center">
										<div className="pour-dot-core w-1.5 h-1.5 rounded-full" />
									</div>
									<Card glow="amber">
										<div className="flex flex-wrap items-start justify-between gap-2 mb-1">
											<h3 className="text-white font-bold text-sm">{m.title}</h3>
											<span className="text-amber-500/70 font-mono text-[10px] tracking-widest">{m.year}</span>
										</div>
										<p className="text-slate-400 text-sm leading-relaxed">{m.desc}</p>
									</Card>
								</Reveal>
							))}
						</div>
					</PourTimeline>
				</section>

				{/* ── Tech Stack ── */}
				<section className="mb-16">
					<Reveal>
						<SectionHeader
							title="The Toolbox"
							eyebrow="tech stack"
							subtitle="// what the platform is built with"
						/>
					</Reveal>

					<div className="space-y-5">
						{SKILL_GROUPS.map((group, i) => (
							<Reveal key={group.label} delay={i * 60}>
								<div>
									<p className="text-slate-500 font-mono text-xs uppercase tracking-widest mb-2">
										{group.label}
									</p>
									<div className="flex flex-wrap gap-2">
										{group.skills.map(skill => (
											<TechBadge key={skill} label={skill} color={group.color} />
										))}
									</div>
								</div>
							</Reveal>
						))}
					</div>
				</section>

			</div>
		</div>
	);
}