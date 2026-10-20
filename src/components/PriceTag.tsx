import type { PriceView } from "@/lib/pricing";
import { cn } from "@/lib/cn";

/** Цена услуги. Реальная цена — крупно; «Стоимость уточняется» / «Индивидуальный расчёт» — спокойным тоном. */
export function PriceTag({ price, large = false }: { price: PriceView; large?: boolean }) {
  return (
    <div>
      <p className={cn(price.isQuote ? "text-mist" : "font-display text-cream", large ? "text-2xl" : price.isQuote ? "text-sm" : "text-2xl")}>
        {price.text}
      </p>
      {price.note ? <p className="mt-1 text-xs text-mist">{price.note}</p> : null}
    </div>
  );
}
