import { notFound } from "next/navigation";
import { cache } from "react";

import { isLocale, type Locale } from "@/lib/i18n";

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

/**
 * Memoised for the render pass, so a route that reads the dictionary from both
 * `generateMetadata` and its component pays for it once.
 */
export const getDictionary = cache(
  (locale: Locale): Promise<Dictionary> => dictionaries[locale](),
);

/**
 * The preamble every localised route needs: widen `params`, reject a prefix we
 * don't speak, load that language's copy.
 *
 * The 404 is belt and braces — `dynamicParams = false` on the `[lang]` layout
 * already turns an unknown prefix away — but it's what narrows `lang` from
 * `string` to `Locale` for everything downstream.
 */
export async function localePage(params: Promise<{ lang: string }>) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  return { lang, dict: await getDictionary(lang) };
}
