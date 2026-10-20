import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { content } from "@/content";

export default function sitemap(): MetadataRoute.Sitemap {
  return content.nav.map((item) => ({
    url: `${siteConfig.url}${item.href === "/" ? "" : item.href}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: item.href === "/" ? 1 : 0.7,
  }));
}
