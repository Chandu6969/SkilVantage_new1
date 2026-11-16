import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { headers } from "next/headers";
import { AnalyticsBeacon } from "@/components/analytics-beacon";
import { brand } from "@/lib/content";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "127.0.0.1:3847";
  const proto =
    headerList.get("x-forwarded-proto") ||
    (host.startsWith("127.") || host.includes("localhost") ? "http" : "https");
  return {
  metadataBase: new URL(`${proto}://${host}`),
  title: {
    default: "SkilVantage · Data Analyst, Data Science and AI Career Training",
    template: "%s · SkilVantage",
  },
  description:
    "SkilVantage is a career training consultancy for students, freshers and working professionals. Job-readiness focused programs in Data Analytics, Data Science, AI/ML, Generative AI and Agentic AI.",
  applicationName: brand.name,
  keywords: [
    "Data Analyst Training",
    "Data Science Training",
    "AI ML Training",
    "Generative AI Training",
    "Agentic AI Training",
    "AI Courses",
    "Data Analytics Course",
    "Career Training",
    "Job Ready Training",
    "AI Career Training",
    "Data Science Career",
    "AI Career",
    "GenAI Course",
    "Agentic AI Course",
  ],
  openGraph: {
    title: "SkilVantage · Learn Skills. Build Careers. Become Job Ready.",
    description: brand.tagline + " Career programs in Data, AI, ML, Generative AI and Agentic AI.",
    siteName: "SkilVantage",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkilVantage",
    description: brand.tagline,
  },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <AnalyticsBeacon />
      </body>
    </html>
  );
}
