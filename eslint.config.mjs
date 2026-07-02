import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

// Next 16 removed `next lint`; ESLint is invoked directly (`eslint .`), so the
// shared Next.js flat configs are spread in and the build output is ignored here
// (previously handled implicitly by `next lint`).
const eslintConfig = [
	{
		ignores: [".next/**", "out/**", "next-env.d.ts"],
	},
	...coreWebVitals,
	...typescript,
];

export default eslintConfig;
