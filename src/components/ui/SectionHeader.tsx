import ForgedHeading from "./ForgedHeading";

interface SectionHeaderProps {
	title: string;
	eyebrow?: string;
	subtitle?: string;
	/*
		Pages that use this as their page title pass "h1". Everything else is a
		section inside a page and stays an h2, which is the default. Without this
		/projects and /contact shipped with no h1 on the page at all.
	*/
	as?: "h1" | "h2";
}

export default function SectionHeader({ title, eyebrow, subtitle, as = "h2" }: SectionHeaderProps) {
	return (
		<div className="mb-10">
			{eyebrow && (
				<p className="text-amber-400/70 font-mono text-[10px] tracking-[0.4em] uppercase mb-2">
					◈ {eyebrow} ◈
				</p>
			)}
			<ForgedHeading as={as} className="text-3xl sm:text-4xl font-bold gradient-text glow-text pb-2 mb-2">
				{title}
			</ForgedHeading>
			{subtitle && (
				<p className="text-slate-500 text-sm font-mono">{subtitle}</p>
			)}
			<div className="h-px mt-4 animate-gradient-line" />
		</div>
	);
}
