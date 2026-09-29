import { cn } from "@/utils/cn";

interface SpaceLinkProps {
	href: string;
	children: React.ReactNode;
	size?: "sm" | "md";
	className?: string;
}

/**
 * A link out to the personal portfolio, styled to look like a doorway into
 * that site's own blue/space theme rather than blending into this site's
 * amber forge palette. The idle star glow (not just on hover) mirrors the
 * personal portfolio's own ForgeLink treatment of the reverse link.
 */
export default function SpaceLink({ href, children, size = "md", className }: SpaceLinkProps) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className={cn(
				"tap-pad group relative inline-flex items-center gap-2 rounded-full border border-blue-400/40",
				"bg-gradient-to-r from-blue-500/15 via-sky-500/10 to-blue-500/15",
				"font-mono uppercase tracking-widest transition-all duration-300 animate-star-glow",
				"hover:border-blue-300/70 hover:-translate-y-0.5 hover:from-blue-500/25 hover:via-sky-500/20 hover:to-blue-500/25",
				size === "sm" ? "px-3 py-1 text-[10px]" : "px-4 py-1.5 text-xs",
				className
			)}
		>
			{/* A five-point star — the space counterpart to the anvil mark on the forge link */}
			<svg
				className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-300 transition-colors duration-200 shrink-0"
				viewBox="0 0 24 24"
				fill="currentColor"
				aria-hidden="true"
			>
				<path d="M12 1.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7-5.4-4.8 7.1-.7z" />
			</svg>
			<span className="text-blue-200 group-hover:text-blue-100 transition-colors duration-200">
				{children}
			</span>
			<span aria-hidden="true" className="text-blue-300 group-hover:translate-x-0.5 transition-transform duration-200">
				→
			</span>
		</a>
	);
}
