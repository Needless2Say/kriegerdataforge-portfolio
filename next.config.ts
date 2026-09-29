import type { NextConfig } from "next";
import { BASE_PATH } from "./src/constants/routes";

const nextConfig: NextConfig = {
	output: "export",
	// Single source of truth, shared with the anchors the nav renders.
	basePath: BASE_PATH,
	assetPrefix: `${BASE_PATH}/`,
	images: {
		unoptimized: true,
	},
};

export default nextConfig;
