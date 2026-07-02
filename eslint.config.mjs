// ─────────────────────────────────────────────────────────────────────────────
// ESLint is intentionally pinned to v9 (NOT v10). The Dependabot eslint-10 bump
// is held open on purpose: eslint-config-next@16 bundles eslint-plugin-react
// (latest 7.37.x, peer-capped at eslint ^9.7), which still calls the
// `context.getFilename()` API that ESLint 10 REMOVED. Under eslint 10 the lint
// crashes with `TypeError: contextOrFilename.getFilename is not a function` on
// the first file, and no eslint-10-compatible eslint-plugin-react /
// eslint-config-next release exists yet. Revisit the eslint-10 upgrade once Next
// ships an eslint-10-ready config line, then close the held Dependabot PR.
// ─────────────────────────────────────────────────────────────────────────────

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
