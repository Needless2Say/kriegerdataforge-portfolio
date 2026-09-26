import type { ProjectStatus } from "@/types/portfolio";

interface StatusPillProps {
	status: ProjectStatus;
}

/*
	Both the home page and the projects page render this pill, and they used to
	carry their own copy of the colour ladder. One copy means a new status cannot
	quietly fall through to the neutral style on one page and not the other.
*/
const STATUS_STYLES: Record<ProjectStatus, string> = {
	"in development":  "text-amber-300  border-amber-600/40  bg-amber-950/40",
	"security review": "text-violet-300 border-violet-600/40 bg-violet-950/40",
	"pre-launch":      "text-blue-300   border-blue-600/40   bg-blue-950/40",
	"planned":         "text-slate-400  border-slate-600/40  bg-slate-900/40",
};

export default function StatusPill({ status }: StatusPillProps) {
	return (
		<span className={`font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_STYLES[status]}`}>
			{status}
		</span>
	);
}
