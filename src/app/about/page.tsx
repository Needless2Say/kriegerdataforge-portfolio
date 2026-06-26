import type { Metadata } from "next";
import Link from "next/link";
import { KDF_INFO } from "@/constants/kdf-info";
import { SKILL_GROUPS } from "@/constants/skills";
import SectionHeader from "@/components/ui/SectionHeader";
import TechBadge from "@/components/ui/TechBadge";
import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";

export const metadata: Metadata = {
	title: "About",
	description: "The story behind KriegerDataForge — a personal data platform built by Arthur Krieger.",
	alternates: { canonical: "https://needless2say.github.io/kriegerdataforge-portfolio/about" },
};

const MILESTONES = [
	{
		year: "2021",
		title: "University of Michigan",
		desc: "B.S. Computer Science + Data Science — built the foundation in data systems and software engineering.",
	},
	{
		year: "2021–2024",
		title: "Field Testing",
		desc: "Internships at Charles Schwab, Revantage (Blackstone), and Wayne State University — forged skills in production data pipelines and platform engineering.",
	},
	{
		year: "2024",
		title: "KDF Ignited",
		desc: "Founded KriegerDataForge — a shared FastAPI + PostgreSQL platform to power personal projects and explore full-stack data engineering.",
	},
	{
		year: "2025 →",
		title: "Active Deployment",
		desc: "Software/Platform Engineer at Charles Schwab · Chicago, IL · Building on KDF in parallel.",
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
						<h1 className="text-4xl sm:text-5xl font-bold gradient-text glow-text pb-2 mb-4">
							What is KDF?
						</h1>
						<p className="text-slate-300 text-base leading-relaxed">
							{KDF_INFO.description}
						</p>
					</div>
				</Reveal>

				{/* ── Mission ── */}
				<Reveal className="mb-16">
					<div className="glass-card border-amber-700/20 p-7 text-center">
						<p className="text-amber-500/60 font-mono text-[10px] tracking-[0.4em] uppercase mb-3">◈ mission ◈</p>
						<p className="text-slate-200 text-base leading-relaxed italic max-w-2xl mx-auto">
							&ldquo;{KDF_INFO.mission}&rdquo;
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
									<h3 className="text-white font-bold text-lg mb-0.5">Arthur Krieger</h3>
									<p className="text-amber-400 text-sm font-mono mb-3">Founder · Software/Platform Engineer</p>
									<p className="text-slate-300 text-sm leading-relaxed mb-4">
										CS + Data Science graduate from the University of Michigan (2025, GPA 3.77). Currently a Software/Platform Engineer on the Wealth Asset Management data team at Charles Schwab in Chicago. KriegerDataForge is the personal lab where ideas get forged into running products.
									</p>
									<div className="flex flex-wrap gap-2">
										<Link
											href={KDF_INFO.links.github}
											target="_blank"
											rel="noopener noreferrer"
											className="text-slate-400 hover:text-amber-300 font-mono text-xs transition-colors duration-200"
										>
											GitHub →
										</Link>
										<span className="text-slate-700">·</span>
										<Link
											href={KDF_INFO.links.linkedin}
											target="_blank"
											rel="noopener noreferrer"
											className="text-slate-400 hover:text-amber-300 font-mono text-xs transition-colors duration-200"
										>
											LinkedIn →
										</Link>
									</div>
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
							subtitle="// how it was built"
						/>
					</Reveal>

					<div className="relative">
						<div className="absolute left-3 top-2 bottom-2 w-px"
							style={{ background: "linear-gradient(to bottom, rgba(245,158,11,0.5) 0%, rgba(59,130,246,0.4) 70%, rgba(100,116,139,0.15) 100%)" }}
						/>
						<div className="space-y-4">
							{MILESTONES.map((m, i) => (
								<Reveal key={i} className="relative pl-12" delay={i * 80}>
									<div className="absolute left-3 top-5 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#0a0704] border-2 border-amber-500 flex items-center justify-center">
										<div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
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
					</div>
				</section>

				{/* ── Tech Stack ── */}
				<section className="mb-16">
					<Reveal>
						<SectionHeader
							title="The Toolbox"
							eyebrow="tech stack"
							subtitle="// tools used to forge products"
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
