import { CURRENCY_SYMBOL, pricing, type ServicePricing } from "@/config/pricing";

export interface PriceView {
  /** Основная строка: «от 25 000 ₸» или «Стоимость уточняется» */
  text: string;
  /** true, если реальная цена не задана */
  isQuote: boolean;
  /** true для индивидуального расчёта */
  isCustom: boolean;
  duration?: string;
  note?: string;
}

const FALLBACK: ServicePricing = { priceKzt: null, label: "Стоимость уточняется" };

export function formatKzt(amount: number): string {
  // Неразрывный пробел как разделитель разрядов, чтобы число не переносилось.
  const digits = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return `${digits}\u00A0${CURRENCY_SYMBOL}`;
}

function formatNumber(amount: number): string {
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
}

export function getPrice(serviceId: string): PriceView {
  const p = pricing[serviceId] ?? FALLBACK;
  const hasPrice = typeof p.priceKzt === "number" && Number.isFinite(p.priceKzt) && p.priceKzt > 0;
  const hasMax = hasPrice && typeof p.priceMaxKzt === "number" && p.priceMaxKzt > (p.priceKzt as number);
  const amount = hasPrice ? formatKzt(p.priceKzt as number) : null;
  const prefix = p.from || p.custom ? "от\u00A0" : "";
  // Диапазон: «от 50 000 до 500 000 ₸»
  const rangeText = hasMax ? `от\u00A0${formatNumber(p.priceKzt as number)} до\u00A0${formatKzt(p.priceMaxKzt as number)}` : null;
  return {
    text: rangeText ?? (amount ? `${prefix}${amount}` : p.label),
    isQuote: !hasPrice,
    isCustom: Boolean(p.custom),
    duration: p.duration?.trim() || undefined,
    note: p.note?.trim() || undefined,
  };
}
