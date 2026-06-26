import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "export",
	basePath: "/kriegerdataforge-portfolio",
	assetPrefix: "/kriegerdataforge-portfolio/",
	images: {
		unoptimized: true,
	},
	webpack: (config, { dev, isServer }) => {
		if (dev && !isServer) {
			config.watchOptions = { poll: 800, aggregateTimeout: 300 };
		}
		return config;
	},
};

export default nextConfig;
