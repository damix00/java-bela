import { notFound } from "next/navigation";

import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import FaqSection from "@/components/pages/home/sections/FaqSection";
import Hero from "@/components/pages/home/sections/Hero";
import LeaderboardSection from "@/components/pages/home/sections/LeaderboardSection";
import RankedSection from "@/components/pages/home/sections/RankedSection";
import WaitlistSection from "@/components/pages/home/sections/WaitlistSection";
import { getDictionary } from "@/dictionaries";
import { isLocale } from "@/lib/i18n";

export default async function Page({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  // Loaded once here and handed down as props, so the sections stay plain
  // presentational components with no locale plumbing of their own.
  const dict = await getDictionary(lang);

  return (
    <>
      <SiteHeader copy={dict.nav} locale={lang} />
      <main>
        <Hero copy={dict.hero} form={dict.form} />
        <RankedSection copy={dict.ranked} />
        <LeaderboardSection copy={dict.leaderboard} />
        <FaqSection copy={dict.faq} />
        <WaitlistSection copy={dict.waitlist} form={dict.form} />
      </main>
      <SiteFooter copy={dict.footer} />
    </>
  );
}
