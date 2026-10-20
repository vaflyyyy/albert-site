import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export function pageMetadata(opts: { title: string; description: string; path: string }): Metadata {
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: {
      title: `${opts.title} — ${siteConfig.name}`,
      description: opts.description,
      url: opts.path,
      type: "website",
      locale: siteConfig.locale,
      siteName: siteConfig.name,
    },
  };
}
