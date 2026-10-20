import "server-only";
import fs from "node:fs";
import path from "node:path";
import { imageBases } from "@/config/images";
import { content } from "@/content";

const EXTS = ["jpg", "jpeg", "webp", "png", "avif"];
const DIR = path.join(process.cwd(), "public", "images");

/** Возвращает "/images/<файл>" если файл существует, иначе undefined. */
export function resolveImage(base: string): string | undefined {
  for (const ext of EXTS) {
    if (fs.existsSync(path.join(DIR, `${base}.${ext}`))) return `/images/${base}.${ext}`;
  }
  return undefined;
}

export interface SiteImages {
  hero?: string;
  portrait?: string;
  about?: string;
  bar?: string;
  services: Record<string, string | undefined>;
  serviceGallery: Record<string, string[]>;
  portfolio: Record<string, string | undefined>;
}

export function getSiteImages(): SiteImages {
  return {
    hero: resolveImage(imageBases.hero),
    portrait: resolveImage(imageBases.portrait),
    about: resolveImage(imageBases.about),
    bar: resolveImage(imageBases.bar),
    services: Object.fromEntries(content.services.map((s) => [s.id, resolveImage(imageBases.service(s.id))])),
    serviceGallery: Object.fromEntries(
      content.services.map((s) => [
        s.id,
        [1, 2, 3, 4].map((n) => resolveImage(imageBases.serviceGallery(s.id, n))).filter((x): x is string => Boolean(x)),
      ]),
    ),
    portfolio: Object.fromEntries(content.portfolio.items.map((p, i) => [p.id, resolveImage(imageBases.portfolio(i + 1))])),
  };
}
