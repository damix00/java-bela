import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import FaqSection from "@/components/pages/home/sections/FaqSection";
import Hero from "@/components/pages/home/sections/Hero";
import LeaderboardSection from "@/components/pages/home/sections/LeaderboardSection";
import RankedSection from "@/components/pages/home/sections/RankedSection";
import WaitlistSection from "@/components/pages/home/sections/WaitlistSection";

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <RankedSection />
        <LeaderboardSection />
        <FaqSection />
        <WaitlistSection />
      </main>
      <SiteFooter />
    </>
  );
}
