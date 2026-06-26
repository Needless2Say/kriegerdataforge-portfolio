import type { Metadata } from "next";
import Link from "next/link";
import { KDF_PROJECTS } from "@/constants/projects";
import { KDF_INFO } from "@/constants/kdf-info";
import SectionHeader from "@/components/ui/SectionHeader";
import TechBadge from "@/components/ui/TechBadge";
import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";

export const metadata: Metadata = {
	title: "Projects",
	description: "All projects built on the KriegerDataForge platform — data engineering tools, full-stack apps, and more.",
	alternates: { canonical: "https://needless2say.github.io/kriegerdataforge-portfolio/projects" },
};

export default function Projects() {
	return (
		<div className="min-h-screen pt-24 pb-16 px-4">
			<div className="max-w-4xl mx-auto">

				<Reveal>
					<SectionHeader
						title="Project Forge"
						eyebrow="all builds"
						subtitle="// everything forged on the KDF platform"
					/>
				</Reveal>

				<div className="space-y-6">
					{KDF_PROJECTS.map((project, i) => (
						<Reveal key={project.id} delay={i * 90}>
							<Card glow="amber">
								<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
									<div className="flex-grow">
										<div className="flex flex-wrap items-center gap-3 mb-3">
											<span className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
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

										<h2 className="text-white font-bold text-xl mb-2">{project.title}</h2>

										<p className="text-slate-300 text-sm leading-relaxed mb-3">
											{project.longDescription ?? project.description}
										</p>

										<div className="flex flex-wrap gap-1.5 mb-4">
											{project.tech.map(t => (
												<TechBadge key={t} label={t} color={project.color} />
											))}
										</div>

										{project.links?.github && (
											<Link
												href={project.links.github}
												target="_blank"
												rel="noopener noreferrer"
												className="text-amber-400/70 hover:text-amber-300 font-mono text-xs tracking-wider transition-colors duration-200"
											>
												view on github →
											</Link>
										)}
									</div>

									{/* Status indicator */}
									<div className="flex-shrink-0 flex items-center gap-2 sm:flex-col sm:items-end">
										<div className="flex items-center gap-1.5">
											<span className={`relative flex h-2 w-2 ${
												project.status === "active" ? "visible" : "invisible"
											}`}>
												<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
												<span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
											</span>
										</div>
									</div>
								</div>
							</Card>
						</Reveal>
					))}
				</div>

				{/* GitHub CTA */}
				<Reveal delay={400}>
					<div className="mt-12 text-center">
						<p className="text-slate-500 text-sm mb-4">All source code available on GitHub</p>
						<Link
							href={KDF_INFO.links.github}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-amber-600/30 text-amber-400 hover:text-amber-300 hover:border-amber-500/50 hover:shadow-[0_0_16px_rgba(245,158,11,0.2)] font-mono text-sm transition-all duration-200"
						>
							<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
							</svg>
							Needless2Say on GitHub
						</Link>
					</div>
				</Reveal>

			</div>
		</div>
	);
}
