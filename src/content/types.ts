export interface NavItem { href: string; label: string }

export interface Service {
  id: string;
  title: string;
  short: string;
  description: string;
  audience: string[];
  includes: string[];
  format: string;
  // Цена и длительность задаются в src/config/pricing.ts
}

export interface ExperienceItem {
  name: string;
  /** Optional facts — render only when filled in */
  role?: string;
  period?: string;
  highlights?: string[];
}

export type PortfolioCategory = "espresso" | "latte-art" | "cupping" | "bars";

export interface PortfolioItem {
  id: string;
  title: string;
  category: PortfolioCategory;
  alt: string;
  /** Path under /public, e.g. "/images/latte-1.jpg". Leave undefined to show a placeholder. */
  src?: string;
  tone: "espresso" | "sand" | "olive" | "cream";
}

export interface ProcessStep { title: string; text: string }

export interface FaqItem { q: string; a: string }

export interface Content {
  nav: NavItem[];
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    photo?: string;
    photoAlt: string;
  };
  intro: { title: string; paragraphs: string[] };
  services: Service[];
  experience: ExperienceItem[];
  about: {
    title: string;
    lead: string;
    paragraphs: string[];
    principles: { title: string; text: string }[];
    photo?: string;
  };
  portfolio: { categories: { id: PortfolioCategory; label: string }[]; items: PortfolioItem[] };
  barOpening: {
    title: string;
    lead: string;
    steps: ProcessStep[];
    deliverables: string[];
    forWhom: string[];
  };
  booking: { title: string; lead: string; confirmationNote: string };
  faq: FaqItem[];
}
