/**
 * ФОТОГРАФИИ. Положите файлы в /public/images — они подхватятся автоматически (jpg, jpeg, png, webp, avif).
 * Пока файла нет, показывается аккуратная заглушка, а не чужое фото.
 *
 *   hero.jpg                  — главное фото на первом экране (кофе, молоко, латте-арт)
 *   albert.jpg                — портрет Альберта (только настоящий портрет!)
 *   about.jpg                 — фото для блока «Опыт»
 *   bar.jpg                   — фото для блока «Открытие кофейни»
 *   service-<id>.jpg          — фото карточек услуг (id услуги из src/content/ru.ts)
 *   service-<id>-1.jpg … -3   — фото-лента внутри подробной карточки на странице «Услуги»
 *   portfolio-1.jpg … -8.jpg  — галерея
 */
export const imageBases = {
  hero: "hero",
  portrait: "albert",
  about: "about",
  bar: "bar",
  service: (id: string) => `service-${id}`,
  serviceGallery: (id: string, n: number) => `service-${id}-${n}`,
  portfolio: (n: number) => `portfolio-${n}`,
} as const;
