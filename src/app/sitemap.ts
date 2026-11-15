import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { programs } from "@/lib/content";

async function origin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "127.0.0.1:3847";
  const proto = headerList.get("x-forwarded-proto") || (host.startsWith("127.") || host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await origin();
  const paths = [
    "",
    "/programs",
    "/roadmaps",
    "/projects",
    "/job-ready",
    "/about",
    "/contact",
    "/register",
    "/privacy",
    ...programs.flatMap((program) => [`/programs/${program.slug}`, `/roadmaps/${program.slug}`]),
  ];
  return paths.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/programs/") ? 0.8 : 0.6,
  }));
}
