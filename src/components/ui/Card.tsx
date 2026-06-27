import { cn } from "@/utils/cn";

interface CardProps {
	children: React.ReactNode;
	className?: string;
	glow?: "amber" | "blue" | "none";
}

const glowMap = {
	amber: "hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.12)]",
	blue:  "hover:border-blue-500/30  hover:shadow-[0_0_30px_rgba(59,130,246,0.12)]",
	none:  "",
};

export default function Card({ children, className, glow = "amber" }: CardProps) {
	return (
		<div className={cn("glass-card p-5 transition-all duration-300", glowMap[glow], className)}>
			{children}
		</div>
	);
}
