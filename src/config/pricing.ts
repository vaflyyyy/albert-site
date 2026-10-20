/**
 * ЦЕНЫ — единственное место, где их нужно редактировать.
 *
 * Ключ = id услуги из src/content/ru.ts.
 * Валюта: казахстанский тенге (KZT, ₸).
 *
 *  • priceKzt: число (например 25000) или null, если цена не определена.
 *    Цены НЕ придуманы: пока стоит null, на сайте показывается `label`.
 *  • from: true → «от 25 000 ₸»
 *  • custom: true → индивидуальный расчёт (для проектных услуг). Если priceKzt задан, он показывается как ориентир «от …».
 *  • label: что показать, пока priceKzt = null.
 *  • duration / note: необязательно. Выводятся на сайте только если заполнены.
 */
export interface ServicePricing {
  priceKzt: number | null;
  /** Верхняя граница диапазона: «от 50 000 до 500 000 ₸» (priceKzt — нижняя граница) */
  priceMaxKzt?: number;
  from?: boolean;
  custom?: boolean;
  label: string;
  /** Например: "2 часа". Не показывается, если не задано. */
  duration?: string;
  /** Дополнительная пометка под ценой. Не показывается, если не задана. */
  note?: string;
}

export const pricing: Record<string, ServicePricing> = {
  "basic-training": {
    priceKzt: 50000,
    label: "Стоимость уточняется",
    note: "Латте-арт и каппинг входят в программу",
  },
  "bar-opening": {
    priceKzt: 50000,
    priceMaxKzt: 500000,
    custom: true,
    label: "Индивидуальный расчёт",
    note: "Итоговая стоимость зависит от проекта",
  },
  consultation: { priceKzt: null, label: "Стоимость уточняется" },
};

export const CURRENCY_SYMBOL = "₸";
