import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import FaqSection from "@/components/pages/home/sections/FaqSection";
import Hero from "@/components/pages/home/sections/Hero";
import LeaderboardSection from "@/components/pages/home/sections/LeaderboardSection";
import RankedSection from "@/components/pages/home/sections/RankedSection";
import ClosingSection from "@/components/pages/home/sections/ClosingSection";
import { localePage } from "@/dictionaries";

export default async function Page({ params }: PageProps<"/[lang]">) {
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
