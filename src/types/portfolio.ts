export type BadgeColor = "forge" | "data" | "system" | "infra" | "gray" | "default";

export interface SkillGroup {
	label: string;
	color: BadgeColor;
	skills: string[];
}

/*
	Where each piece actually is, rather than a product lifecycle. The old set was
	active / beta / planned, which implied things were running in front of users.
	Nothing on the platform is in front of anyone yet, and saying otherwise on a
	public site is a claim that cannot be backed up.
*/
export type ProjectStatus = "in development" | "security review" | "pre-launch" | "planned";

export interface Project {
	id: string;
	title: string;
	description: string;
	longDescription?: string;
	tech: string[];
	status: ProjectStatus;
	category: string;
	color: BadgeColor;
	links?: {
		github?: string;
		live?: string;
	};
}
