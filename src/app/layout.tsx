import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

const SITE_URL = process.env.NEXTAUTH_URL || "https://LeagueScout.gg";
const SITE_NAME = "LeagueScout";
const DEFAULT_DESCRIPTION =
  "Discover and analyze the next generation of League of Legends talent. Professional scouting reports, player profiles, and data-driven insights.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - LoL Esports Scouting Platform`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "League of Legends",
    "LoL",
    "esports",
    "scouting",
    "player profiles",
    "talent discovery",
    "LFL",
    "LEC",
    "ERL",
  ],
  authors: [{ name: "LeagueScout" }],
  creator: "LeagueScout",
  publisher: "LeagueScout",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - LoL Esports Scouting Platform`,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: `/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Discover League of Legends Talent`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - LoL Esports Scouting Platform`,
    description: DEFAULT_DESCRIPTION,
    images: [`/og-image.png`],
    creator: "@LeagueScout",
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-US": SITE_URL,
      "x-default": SITE_URL,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-text-heading">
        <SessionProvider>
          <ThemeProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-accent focus:text-text-heading focus:rounded-md focus:font-medium"
            >
              Skip to main content
            </a>
            <Header />
            <main id="main-content" className="flex-1">{children}</main>
            <Footer />
            <Toaster position="bottom-right" richColors />
            <Analytics />
            <SpeedInsights />
          </ThemeProvider>
        </SessionProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== "undefined") {
                window.addEventListener("unhandledrejection", (event) => {
                  // Sentry captures unhandled rejections automatically
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

