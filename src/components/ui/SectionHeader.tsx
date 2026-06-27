interface SectionHeaderProps {
	title: string;
	eyebrow?: string;
	subtitle?: string;
}

export default function SectionHeader({ title, eyebrow, subtitle }: SectionHeaderProps) {
	return (
		<div className="mb-10">
			{eyebrow && (
				<p className="text-amber-400/70 font-mono text-[10px] tracking-[0.4em] uppercase mb-2">
					◈ {eyebrow} ◈
				</p>
			)}
			<h2 className="text-3xl sm:text-4xl font-bold gradient-text glow-text pb-2 mb-2">
				{title}
			</h2>
			{subtitle && (
				<p className="text-slate-500 text-sm font-mono">{subtitle}</p>
			)}
			<div className="h-px mt-4 animate-gradient-line" />
		</div>
	);
}
