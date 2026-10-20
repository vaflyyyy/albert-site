import Image from "next/image";
import { cn } from "@/lib/cn";
import { CupIcon } from "./icons";

interface PhotoSlotProps {
  src?: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  /** Подпись внутри заглушки (только когда фото нет) */
  label?: string;
  /** Затемнение поверх фото для читаемости текста */
  shade?: boolean;
}

/** Настоящее фото, если `src` задан, иначе тёмная заглушка. Размер задаётся через className. */
export function PhotoSlot({ src, alt, className, priority, sizes = "(min-width: 1024px) 33vw, 100vw", label, shade }: PhotoSlotProps) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-surface", className)}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
        {shade ? <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-transparent" /> : null}
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={`${alt} (фото будет добавлено)`}
      className={cn("grain relative flex items-center justify-center overflow-hidden bg-surface-2", className)}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(168,137,101,0.28),transparent_60%),radial-gradient(ellipse_at_80%_90%,rgba(111,89,63,0.35),transparent_55%)]" />
      <div aria-hidden="true" className="absolute -right-10 -top-10 h-44 w-44 rounded-full border border-caramel/20" />
      <div aria-hidden="true" className="absolute -bottom-14 -left-10 h-52 w-52 rounded-full border border-caramel/15" />
      <div className="relative z-10 flex flex-col items-center gap-2 text-center text-caramel-300/80">
        <CupIcon width={34} height={34} />
        {label ? <span className="px-4 text-[0.65rem] uppercase tracking-eyebrow">{label}</span> : null}
      </div>
    </div>
  );
}
