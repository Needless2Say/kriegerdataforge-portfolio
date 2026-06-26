import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar, Footer, PageTransition } from "@/components/layout";
import EmberField from "@/components/ui/EmberField";
import ScrollProgress from "@/components/ui/ScrollProgress";
import ScrollToTop from "@/components/ui/ScrollToTop";

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

const BASE_URL = "https://needless2say.github.io/kriegerdataforge-portfolio";

export const metadata: Metadata = {
	metadataBase: new URL(BASE_URL),
	title: {
		default: "KriegerDataForge | Data Engineering & Full-Stack Platform",
		template: "%s | KriegerDataForge",
	},
	description:
		"KriegerDataForge — a full-stack data platform built by Arthur Krieger. FastAPI + PostgreSQL backend powering apps in fitness, gaming, and data engineering. Based in Chicago, IL.",
	keywords: [
		"KriegerDataForge",
		"Data Engineering",
		"FastAPI",
		"PostgreSQL",
		"Full Stack Development",
		"Next.js",
		"Python",
		"Snowflake",
		"Arthur Krieger",
		"Chicago",
		"data pipelines",
		"fitness app",
	],
	authors: [{ name: "Arthur Krieger", url: BASE_URL }],
	creator: "Arthur Krieger",
	publisher: "KriegerDataForge",
	robots: { index: true, follow: true },
	openGraph: {
		type: "website",
		locale: "en_US",
		url: BASE_URL,
		siteName: "KriegerDataForge",
		title: "KriegerDataForge | Data Engineering & Full-Stack Platform",
		description:
			"Forging raw data into powerful products. FastAPI + PostgreSQL backbone. Full-stack apps across fitness, gaming, and data engineering.",
	},
	twitter: {
		card: "summary_large_image",
		title: "KriegerDataForge | Data Engineering & Full-Stack Platform",
		description:
			"Forging raw data into powerful products. Built by Arthur Krieger in Chicago.",
	},
	alternates: { canonical: BASE_URL },
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
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
			</body>
		</html>
	);
}
