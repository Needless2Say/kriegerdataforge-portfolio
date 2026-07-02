import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "export",
	basePath: "/kriegerdataforge-portfolio",
	assetPrefix: "/kriegerdataforge-portfolio/",
	images: {
		unoptimized: true,
	},
};

export default nextConfig;
