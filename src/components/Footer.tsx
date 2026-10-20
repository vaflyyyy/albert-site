import Link from "next/link";
import { content } from "@/content";
import { siteConfig } from "@/config/site";
import { ContactButtons } from "./ContactButtons";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-night-900">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.2fr_1fr_1.2fr]">
        <div>
          <p className="font-display text-3xl">{siteConfig.name}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-mist">{siteConfig.role}. Обучение, каппинг, латте-арт и запуск кофейных баров.</p>
        </div>
        <nav aria-label="Навигация в подвале">
          <p className="eyebrow mb-4">Разделы</p>
          <ul className="space-y-2 text-sm text-mist">
            {content.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-cream">{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="eyebrow mb-4">Связаться</p>
          <ContactButtons layout="stack" />
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-mist/70">
        © {new Date().getFullYear()} {siteConfig.name}. Все права защищены.
      </div>
    </footer>
  );
}
