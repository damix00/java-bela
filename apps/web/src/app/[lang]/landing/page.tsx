import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import FaqSection from "@/components/pages/home/sections/FaqSection";
import Hero from "@/components/pages/home/sections/Hero";
import LeaderboardSection from "@/components/pages/home/sections/LeaderboardSection";
import RankedSection from "@/components/pages/home/sections/RankedSection";
import ClosingSection from "@/components/pages/home/sections/ClosingSection";
import { localePage } from "@/dictionaries";
import { locales } from "@/lib/i18n";
import { localeMetadata } from "@/lib/metadata";
import { landingPath } from "@/lib/routes";

/**
 * The marketing page. It owns the canonical URL and the language alternates —
 * the `[lang]` layout can't declare them any more, because the page at
 * `/[lang]` is now the lobby and is deliberately not indexed.
 *
 * Every language points at every other one, itself included, so a crawler that
 * lands on either URL learns about both without following the detection
 * redirect on `/`.
 */
export const generateMetadata = localeMetadata((_dict, lang) => ({
    alternates: {
        canonical: landingPath(lang),
        languages: {
            ...Object.fromEntries(
                locales.map((locale) => [locale, landingPath(locale)]),
            ),
            "x-default": landingPath("en"),
        },
    },
}));

export default async function Page({ params }: PageProps<"/[lang]/landing">) {
    // Loaded once here and handed down as props, so the sections stay plain
    // presentational components with no locale plumbing of their own.
    const { lang, dict } = await localePage(params);

    return (
        <>
            <SiteHeader copy={dict.nav} cta={dict.cta} locale={lang} />
            <main>
                <Hero copy={dict.hero} cta={dict.cta} locale={lang} />
                <RankedSection copy={dict.ranked} />
                <LeaderboardSection copy={dict.leaderboard} locale={lang} />
                <FaqSection copy={dict.faq} />
                <ClosingSection copy={dict.closing} locale={lang} />
            </main>
            <SiteFooter copy={dict.footer} locale={lang} />
        </>
    );
}
