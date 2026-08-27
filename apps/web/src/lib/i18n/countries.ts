import type { Locale } from "@/lib/i18n/config";

/**
 * ISO 3166-1 alpha-2 codes, which is the whole of what `users.country_code`
 * stores.
 *
 * Only the codes live here. Names come from `Intl.DisplayNames`, which every
 * runtime this app targets ships with, so Croatian country names cost nothing
 * in the dictionaries and stay right without anyone maintaining 250 of them
 * twice. The list itself is the UN membership plus the handful of territories
 * that field their own teams — it does not need to be exhaustive to be useful,
 * and a player whose country is missing can leave it blank.
 */
export const COUNTRY_CODES = [
    "AD",
    "AE",
    "AF",
    "AG",
    "AL",
    "AM",
    "AO",
    "AR",
    "AT",
    "AU",
    "AZ",
    "BA",
    "BB",
    "BD",
    "BE",
    "BF",
    "BG",
    "BH",
    "BI",
    "BJ",
    "BN",
    "BO",
    "BR",
    "BS",
    "BT",
    "BW",
    "BY",
    "BZ",
    "CA",
    "CD",
    "CF",
    "CG",
    "CH",
    "CI",
    "CL",
    "CM",
    "CN",
    "CO",
    "CR",
    "CU",
    "CV",
    "CY",
    "CZ",
    "DE",
    "DJ",
    "DK",
    "DM",
    "DO",
    "DZ",
    "EC",
    "EE",
    "EG",
    "ER",
    "ES",
    "ET",
    "FI",
    "FJ",
    "FM",
    "FR",
    "GA",
    "GB",
    "GD",
    "GE",
    "GH",
    "GM",
    "GN",
    "GQ",
    "GR",
    "GT",
    "GW",
    "GY",
    "HN",
    "HR",
    "HT",
    "HU",
    "ID",
    "IE",
    "IL",
    "IN",
    "IQ",
    "IR",
    "IS",
    "IT",
    "JM",
    "JO",
    "JP",
    "KE",
    "KG",
    "KH",
    "KI",
    "KM",
    "KN",
    "KP",
    "KR",
    "KW",
    "KZ",
    "LA",
    "LB",
    "LC",
    "LI",
    "LK",
    "LR",
    "LS",
    "LT",
    "LU",
    "LV",
    "LY",
    "MA",
    "MC",
    "MD",
    "ME",
    "MG",
    "MH",
    "MK",
    "ML",
    "MM",
    "MN",
    "MR",
    "MT",
    "MU",
    "MV",
    "MW",
    "MX",
    "MY",
    "MZ",
    "NA",
    "NE",
    "NG",
    "NI",
    "NL",
    "NO",
    "NP",
    "NR",
    "NZ",
    "OM",
    "PA",
    "PE",
    "PG",
    "PH",
    "PK",
    "PL",
    "PS",
    "PT",
    "PW",
    "PY",
    "QA",
    "RO",
    "RS",
    "RU",
    "RW",
    "SA",
    "SB",
    "SC",
    "SD",
    "SE",
    "SG",
    "SI",
    "SK",
    "SL",
    "SM",
    "SN",
    "SO",
    "SR",
    "SS",
    "ST",
    "SV",
    "SY",
    "SZ",
    "TD",
    "TG",
    "TH",
    "TJ",
    "TL",
    "TM",
    "TN",
    "TO",
    "TR",
    "TT",
    "TV",
    "TW",
    "TZ",
    "UA",
    "UG",
    "US",
    "UY",
    "UZ",
    "VA",
    "VC",
    "VE",
    "VN",
    "VU",
    "WS",
    "XK",
    "YE",
    "ZA",
    "ZM",
    "ZW",
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];

export function isCountryCode(value: string): value is CountryCode {
    return (COUNTRY_CODES as readonly string[]).includes(value);
}

/**
 * Names we pick ourselves rather than take from ICU.
 *
 * `Intl.DisplayNames` at the default `long` style calls `PS` "Palestinian
 * Territories", which is not what a player picking their own country wants to
 * see written next to it. The `short` style says "Palestine" — but it also
 * shortens `GB` to "UK" and several others to abbreviations, so switching the
 * whole list over to fix one entry would cost more than it saves.
 *
 * One entry per locale, and the bar for adding another is a name a player would
 * object to seeing as their own — not a stylistic preference between two names
 * that both read as correct.
 */
const NAME_OVERRIDES: Record<Locale, Record<string, string>> = {
    en: { PS: "Palestine" },
    hr: { PS: "Palestina" },
};

export type CountryOption = { code: string; name: string };

/**
 * The codes paired with their names in the reader's language, sorted the way
 * that language sorts — `localeCompare` is what puts Č after C for a Croatian
 * player rather than at the end of the alphabet.
 *
 * A code the runtime has no name for falls back to the code itself, which is
 * still a truthful thing to render.
 *
 * **Call this on the server and pass the result down.** Node and the browser
 * ship different ICU data, and they do not always agree: Node calls `PS`
 * "Palestina" in Croatian where Chrome calls it "Palestinsko područje". Built
 * on both sides of a render that is server-rendered and then hydrated, that
 * disagreement is a hydration mismatch — and since the sort key is the name,
 * one differing entry can reorder the list around it. One list, built once,
 * where the dictionary is already being read.
 */
export function countryOptions(locale: Locale): CountryOption[] {
    const names = new Intl.DisplayNames([locale], {
        type: "region",
        fallback: "code",
    });

    const overrides = NAME_OVERRIDES[locale];

    return COUNTRY_CODES.map((code) => ({
        code,
        name: overrides[code] ?? names.of(code) ?? code,
    })).sort((a, b) => a.name.localeCompare(b.name, locale));
}

/**
 * One country's name, built the same way `countryOptions` builds two hundred —
 * same overrides, same fallback to the bare code.
 *
 * The caveat above applies here too: **server side only.** Node and the browser
 * disagree on a handful of names, and a name rendered on both sides of a
 * hydration is a mismatch. Both callers are server components.
 */
export function countryName(locale: Locale, code: string): string {
    const names = new Intl.DisplayNames([locale], {
        type: "region",
        fallback: "code",
    });

    return NAME_OVERRIDES[locale][code] ?? names.of(code) ?? code;
}

/**
 * Where the flag drawing for a country lives.
 *
 * Twemoji, copied into `public/flags` by `scripts/sync-flags.mjs`, rather than
 * the flag emoji the code points would produce: Windows ships no flag glyphs
 * whatsoever and renders the regional-indicator pair as the two bare letters,
 * so an emoji flag beside a heading that already says "Croatia" reads as "HR"
 * on a good half of the machines this runs on. One drawing, the same
 * everywhere.
 *
 * Anything that is not two ASCII letters gets null, and the `Flag` component
 * draws nothing rather than requesting a file that isn't there.
 */
export function flagSrc(code: string): string | null {
    if (!/^[A-Za-z]{2}$/.test(code)) return null;

    return `/flags/${code.toUpperCase()}.svg`;
}
