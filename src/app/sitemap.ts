import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE = "https://needless2say.github.io/kriegerdataforge-portfolio";

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{ url: BASE,                    lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
		{ url: `${BASE}/projects`,      lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9 },
		{ url: `${BASE}/about`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
		{ url: `${BASE}/contact`,       lastModified: new Date(), changeFrequency: "yearly",  priority: 0.7 },
	];
}
