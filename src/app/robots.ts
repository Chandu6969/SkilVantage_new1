import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "127.0.0.1:3847";
  const proto = headerList.get("x-forwarded-proto") || (host.startsWith("127.") || host.startsWith("localhost") ? "http" : "https");
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${proto}://${host}/sitemap.xml`,
  };
}
