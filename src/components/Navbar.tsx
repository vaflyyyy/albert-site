"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { content } from "@/content";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";
import { CloseIcon, CupIcon, MenuIcon } from "./icons";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-night/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5 font-display text-2xl tracking-tight">
          <CupIcon width={26} height={26} className="text-caramel" />
          {siteConfig.name}
        </Link>

        <nav aria-label="Основная навигация" className="hidden lg:block">
          <ul className="flex items-center gap-7 text-sm">
            {content.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "border-b border-transparent py-1 text-mist transition-colors hover:text-cream",
                    isActive(item.href) && "border-caramel text-cream",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/contact#booking" className="btn btn-primary hidden !py-2.5 sm:inline-flex">
            Записаться
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <nav id="mobile-menu" aria-label="Мобильная навигация" hidden={!open} className="border-t border-line bg-night lg:hidden">
        <ul className="container-page flex flex-col py-3">
          {content.nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn("block px-2 py-3 font-display text-2xl text-mist", isActive(item.href) && "text-cream")}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li className="pt-3">
            <Link href="/contact#booking" className="btn btn-primary w-full">
              Записаться
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
