import { cn } from "@/utils/cn";
import type { BadgeColor } from "@/types/portfolio";

interface TechBadgeProps {
	label: string;
	color?: BadgeColor;
	size?: "sm" | "md";
}

const colorMap: Record<BadgeColor, string> = {
	forge:   "bg-amber-950/60  text-amber-300  border-amber-700/50",
	data:    "bg-blue-950/60   text-blue-300   border-blue-700/50",
	system:  "bg-violet-950/60 text-violet-300 border-violet-700/50",
	infra:   "bg-slate-800/60  text-slate-300  border-slate-600/50",
	gray:    "bg-slate-800/60  text-slate-400  border-slate-700/50",
	default: "bg-slate-800/60  text-slate-400  border-slate-700/50",
};

export default function TechBadge({ label, color = "default", size = "sm" }: TechBadgeProps) {
	return (
		<span className={cn(
			"inline-flex items-center border rounded-full font-mono font-medium",
			size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
			colorMap[color]
		)}>
			{label}
		</span>
	);
}
