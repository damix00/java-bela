import type { Locale } from "@/lib/i18n";

/**
 * English is the reference shape. Because `dictionaries` below is annotated
 * with it, a key present in `en.json` but missing from `hr.json` fails
 * `tsc --noEmit` — a missing translation is a build error, never a stray
 * English string at runtime.
 */
export type Dictionary = typeof import("./en.json");

// Lazy imports: only the requested locale's JSON is pulled into the server
// bundle for a given render. These are loaded from server components only, so
// no dictionary ever reaches the client.
const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./en.json").then((module) => module.default),
  hr: () => import("./hr.json").then((module) => module.default),
};

export function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
