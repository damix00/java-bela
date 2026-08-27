import type { Metadata } from "next";

import { localePage, type Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n/config";

/**
 * `generateMetadata` for a localised route, without the seven lines of
 * ceremony each one otherwise costs.
 *
 * Every page under `[lang]` needs the same preamble — await `params`, reject an
 * unknown prefix, load the dictionary — and then usually says one thing about
 * itself. Return a string for the common case of a title, or a full `Metadata`
 * object when the page has more to declare:
 *
 * ```ts
 * export const generateMetadata = localeMetadata((dict) => dict.auth.signIn.title);
 * ```
 *
 * The params type is deliberately wider than any single `PageProps<…>`: Next
 * checks the export against the route's own type, and a function that accepts
 * every `[lang]` route satisfies all of them.
 */
export function localeMetadata(
    build: (
        dict: Dictionary,
        lang: Locale,
    ) => Metadata | string | Promise<Metadata | string>,
) {
    return async function generateMetadata({
        params,
    }: {
        params: Promise<{ lang: string }>;
    }): Promise<Metadata> {
        const { lang, dict } = await localePage(params);
        const metadata = await build(dict, lang);

        return typeof metadata === "string" ? { title: metadata } : metadata;
    };
}
