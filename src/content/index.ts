import { ru } from "./ru";
import type { Content } from "./types";

/**
 * i18n entry point. The UI is Russian today.
 * To add Kazakh / English: create `kk.ts` / `en.ts` implementing `Content`,
 * then switch via a `[locale]` route segment or a library such as next-intl (see README).
 */
export const content: Content = ru;
export type { Content } from "./types";
