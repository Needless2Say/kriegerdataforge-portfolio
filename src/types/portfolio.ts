export type BadgeColor = "forge" | "data" | "system" | "infra" | "gray" | "default";

export interface SkillGroup {
	label: string;
	color: BadgeColor;
	skills: string[];
}

export interface Project {
	id: string;
	title: string;
	description: string;
	longDescription?: string;
	tech: string[];
	status: "active" | "beta" | "planned";
	category: string;
	color: BadgeColor;
	links?: {
		github?: string;
		live?: string;
	};
}
