import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import FaqSection from "@/components/pages/home/FaqSection";
import Hero from "@/components/pages/home/Hero";
import HowItPlaysSection from "@/components/pages/home/HowItPlaysSection";
import LeaderboardSection from "@/components/pages/home/LeaderboardSection";
import RankedSection from "@/components/pages/home/RankedSection";
import WaitlistSection from "@/components/pages/home/WaitlistSection";

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <RankedSection />
        <HowItPlaysSection />
        <LeaderboardSection />
        <FaqSection />
        <WaitlistSection />
      </main>
      <SiteFooter />
    </>
  );
}
