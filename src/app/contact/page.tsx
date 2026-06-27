import type { Metadata } from "next";
import Link from "next/link";
import { KDF_INFO } from "@/constants/kdf-info";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";
import ContactForm from "@/components/ui/ContactForm";

export const metadata: Metadata = {
	title: "Contact",
	description: "Get in touch with KriegerDataForge — collaborations, questions, or just to say hello.",
	alternates: { canonical: "https://needless2say.github.io/kriegerdataforge-portfolio/contact" },
};

const CHANNELS = [
	{
		label: "Email",
		value: KDF_INFO.links.email,
		href: `mailto:${KDF_INFO.links.email}`,
		description: "Direct line — best for project inquiries",
		icon: (
			<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
				<rect x="2" y="4" width="20" height="16" rx="2" />
				<path d="m2 7 10 7 10-7" />
			</svg>
		),
	},
	{
		label: "GitHub",
		value: "Needless2Say",
		href: KDF_INFO.links.github,
		description: "Browse the source code and active repos",
		icon: (
			<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
			</svg>
		),
	},
	{
		label: "LinkedIn",
		value: "arthur-krieger",
		href: KDF_INFO.links.linkedin,
		description: "Connect professionally",
		icon: (
			<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
			</svg>
		),
	},
];

export default function Contact() {
	return (
		<div className="min-h-screen pt-24 pb-16 px-4">
			<div className="max-w-3xl mx-auto">

				<Reveal>
					<SectionHeader
						title="Transmission"
						eyebrow="contact"
						subtitle="// open channels to the forge"
					/>
				</Reveal>

				<Reveal delay={60}>
					<p className="text-slate-400 text-base leading-relaxed mb-10 text-center max-w-xl mx-auto">
						Building something with data? Exploring a collaboration? Or just curious about the stack — the forge is open.
					</p>
				</Reveal>

				<div className="space-y-4 mb-12">
					{CHANNELS.map((channel, i) => (
						<Reveal key={channel.label} delay={i * 80}>
							<Link
								href={channel.href}
								target={channel.href.startsWith("mailto") ? undefined : "_blank"}
								rel={channel.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
								className="block group"
							>
								<Card glow="amber" className="flex items-center gap-4 hover:border-amber-600/30 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.12)]">
									<div className="w-12 h-12 rounded-xl bg-amber-950/40 border border-amber-700/30 flex items-center justify-center text-amber-400 group-hover:text-amber-300 group-hover:border-amber-500/50 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-all duration-300 flex-shrink-0">
										{channel.icon}
									</div>
									<div className="flex-grow min-w-0">
										<p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mb-0.5">{channel.label}</p>
										<p className="text-white font-mono text-sm truncate group-hover:text-amber-300 transition-colors duration-200">{channel.value}</p>
										<p className="text-slate-500 text-xs mt-0.5">{channel.description}</p>
									</div>
									<svg className="w-4 h-4 text-slate-600 group-hover:text-amber-400 flex-shrink-0 transition-colors duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
										<path d="m9 18 6-6-6-6" />
									</svg>
								</Card>
							</Link>
						</Reveal>
					))}
				</div>

				{/* Availability note */}
				<Reveal delay={300}>
					<div className="glass-card border-amber-700/15 p-6 text-center">
						<div className="flex items-center justify-center gap-2 mb-2">
							<span className="relative flex h-2 w-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
								<span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
							</span>
							<span className="text-amber-400 font-mono text-xs tracking-widest uppercase">Forge Online</span>
						</div>
						<p className="text-slate-400 text-sm">
							Based in Chicago, IL · Typically responds within 24–48 hours
						</p>
					</div>
				</Reveal>

				{/* ── Direct message form ── */}
				<Reveal delay={400}>
					<div className="mt-10">
						<div className="mb-6">
							<p className="text-amber-500/60 font-mono text-[10px] tracking-[0.4em] uppercase mb-2">
								◈ send a transmission ◈
							</p>
							<h2 className="text-2xl font-bold gradient-text glow-text pb-2">
								Write to the Forge
							</h2>
							<p className="text-slate-500 text-sm mt-1">
								Fill out the form and it lands straight in our inbox.
							</p>
							<div className="h-px mt-4 animate-gradient-line" />
						</div>
						<ContactForm />
					</div>
				</Reveal>

			</div>
		</div>
	);
}
