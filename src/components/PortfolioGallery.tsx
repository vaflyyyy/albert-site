"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { content } from "@/content";
import type { PortfolioCategory, PortfolioItem } from "@/content/types";
import { cn } from "@/lib/cn";
import { PhotoSlot } from "./PhotoSlot";

/** `images` — карта id → путь к фото (собирается на сервере из /public/images). */
export function PortfolioGallery({
  images,
  limit,
  showFilters = true,
}: {
  images: Record<string, string | undefined>;
  limit?: number;
  showFilters?: boolean;
}) {
  const { categories, items } = content.portfolio;
  const [filter, setFilter] = useState<PortfolioCategory | "all">("all");
  const [active, setActive] = useState<PortfolioItem | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (active && !dialog.open) dialog.showModal();
    if (!active && dialog.open) dialog.close();
  }, [active]);

  const visible = items.filter((i) => filter === "all" || i.category === filter).slice(0, limit);
  const activeSrc = active ? images[active.id] : undefined;

  return (
    <div>
      {showFilters ? (
        <div role="group" aria-label="Фильтр по категориям" className="mb-8 flex flex-wrap gap-2">
          {[{ id: "all" as const, label: "Все" }, ...categories].map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={filter === c.id}
              onClick={() => setFilter(c.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors",
                filter === c.id ? "border-caramel bg-caramel-600 text-cream-50" : "border-line text-mist hover:border-caramel hover:text-cream",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : null}

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {visible.map((item, i) => {
          const tall = i % 5 === 0 || i % 5 === 3;
          const aspect = tall ? "aspect-[3/4]" : "aspect-square";
          const src = images[item.id];
          return (
            <li key={item.id}>
              {src ? (
                <button type="button" onClick={() => setActive(item)} aria-label={`Открыть фото: ${item.title}`} className="group block w-full overflow-hidden border border-line text-left">
                  <PhotoSlot src={src} alt={item.alt} sizes="(min-width: 1024px) 25vw, 50vw" className={cn(aspect, "transition-transform duration-700 group-hover:scale-105")} />
                </button>
              ) : (
                <PhotoSlot alt={item.alt} label={item.title} className={cn(aspect, "border border-line")} />
              )}
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-mist">{item.title}</p>
            </li>
          );
        })}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label={active ? active.title : "Фото"}
        onClose={() => setActive(null)}
        onClick={(e) => e.target === e.currentTarget && setActive(null)}
        className="m-auto w-[92vw] max-w-4xl bg-transparent p-0 backdrop:bg-night-900/90"
      >
        {active && activeSrc ? (
          <div className="relative">
            <Image src={activeSrc} alt={active.alt} width={1600} height={1200} className="h-auto max-h-[85vh] w-full object-contain" />
            <button type="button" onClick={() => setActive(null)} className="btn btn-light absolute right-3 top-3 !px-4 !py-2">
              Закрыть
            </button>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
