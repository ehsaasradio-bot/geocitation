import type { MetadataRoute } from "next";
import { SITE_URL } from "./site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/methodology", "/research", "/faq", "/about", "/contact", "/privacy", "/terms", "/accessibility"];
  return routes.map((route, index) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date("2026-07-11"),
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : route === "/methodology" ? 0.9 : 0.7,
  }));
}
