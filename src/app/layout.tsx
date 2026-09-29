import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Navbar, Footer, PageTransition } from "@/components/layout";
import EmberField from "@/components/ui/EmberField";
import ScrollProgress from "@/components/ui/ScrollProgress";
import ScrollToTop from "@/components/ui/ScrollToTop";
import HeatTracker from "@/components/ui/HeatTracker";
import { PAGE_VISIT_SCRIPT } from "@/utils/playOnce";
import { BASE_PATH } from "@/constants/routes";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
};

const BASE_URL = "https://kriegerdataforge.com";

/** Google Analytics for this site. The personal portfolio has its own, separate ID. */
const GA_MEASUREMENT_ID = "G-50SJBQ5MV2";

export const metadata: Metadata = {
	metadataBase: new URL(BASE_URL),
	title: {
		default: "KriegerDataForge | A Personal Platform",
		template: "%s | KriegerDataForge",
	},
	description: "KriegerDataForge is a personal platform Arthur Krieger builds and uses for his own apps. It includes an OAuth 2.0 and OIDC identity provider, shared Python and npm packages, Terraform infrastructure, and the apps built on top of them, across 18 repositories.",
	keywords: [
		"KriegerDataForge",
		"personal software platform",
		"personal project",
		"OAuth 2.0",
		"OIDC",
		"FastAPI",
		"PostgreSQL",
		"Next.js",
		"Python",
		"Terraform",
		"Arthur Krieger",
	],
	authors: [{ name: "Arthur Krieger", url: BASE_URL }],
	creator: "Arthur Krieger",
	/*
		No `publisher`. Naming the brand as publisher implies an organisation
		stands behind the site, and the whole point of this pass is that nothing
		does. The person is the creator and that is the entire chain.
	*/
	robots: { index: true, follow: true },
	openGraph: {
		type: "website",
		locale: "en_US",
		url: BASE_URL,
		siteName: "KriegerDataForge",
		title: "KriegerDataForge | A Personal Platform",
		description:
			"A personal platform Arthur Krieger builds and uses for his own apps, with one identity provider, shared Python and npm packages, and the apps built on top of them.",
	},
	twitter: {
		card: "summary_large_image",
		title: "KriegerDataForge | A Personal Platform",
		description:
			"A personal platform Arthur Krieger builds and uses for his own apps.",
	},
	alternates: { canonical: BASE_URL },
	/*
		The anvil favicon, served from public/. Listed by hand rather than relying
		on Next's automatic app/favicon.ico detection, which broke outright the last
		time this site had a `basePath` set. `BASE_PATH` is currently empty (custom
		domain root deploy), but every icon URL still goes through it so a future
		sub-path deploy can't silently drop the icons again.
	*/
	icons: {
		icon: [
			{ url: `${BASE_PATH}/favicon.ico`, sizes: "16x16 32x32 48x48", type: "image/x-icon" },
			{ url: `${BASE_PATH}/icon.svg`, sizes: "any", type: "image/svg+xml" },
		],
		apple: { url: `${BASE_PATH}/apple-touch-icon.png`, sizes: "180x180", type: "image/png" },
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		/*
			`suppressHydrationWarning` because the head script can add
			`data-revisit` to this element before React loads. It covers this
			element's own attributes only, nothing inside it.
		*/
		<html lang="en" suppressHydrationWarning>
			<head>
				{/* Has to run before the first paint. playOnce.ts explains why. */}
				<script dangerouslySetInnerHTML={{ __html: PAGE_VISIT_SCRIPT }} />

				{/*
					Google Analytics. Loaded after the page is interactive, so it never
					holds up the first paint. Setting `ga-opt-out` to "1" in this
					browser's localStorage turns it off, the same switch the personal
					portfolio uses, so the owner's own visits stay out of the numbers.
				*/}
				<Script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
				<Script id="google-analytics">
					{`
						if (localStorage.getItem('ga-opt-out') === '1') {
							window['ga-disable-${GA_MEASUREMENT_ID}'] = true;
						} else {
							window.dataLayer = window.dataLayer || [];
							function gtag(){dataLayer.push(arguments);}
							gtag('js', new Date());
							gtag('config', '${GA_MEASUREMENT_ID}');
						}
					`}
				</Script>
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<a href="#main-content" className="skip-to-content">
					Skip to content
				</a>

				<ScrollProgress />
				<EmberField />
				<Navbar />

				<main id="main-content" className="relative z-10">
					<PageTransition>{children}</PageTransition>
				</main>

				<Footer />
				<ScrollToTop />
				<HeatTracker />
			</body>
		</html>
	);
}