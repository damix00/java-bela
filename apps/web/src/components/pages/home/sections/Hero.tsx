import WaitlistForm from "@/components/pages/home/blocks/WaitlistForm";
import Heading from "@/components/ui/typography/Heading";
import MediaPanel from "@/components/ui/surfaces/MediaPanel";
import Section from "@/components/layout/Section";
import Text from "@/components/ui/typography/Text";

export default function Hero() {
    return (
        <Section className="grid items-center gap-14 py-14 md:pt-[84px] md:pb-[76px] lg:grid-cols-[1.05fr_.95fr]">
            <div className="flex flex-col items-start gap-[30px]">
                <Heading as="h1" size="hero">
                    Bela online, with a rank that{" "}
                    <span className="box-decoration-clone bg-rust px-[.1em] text-cream">
                        actually counts.
                    </span>
                </Heading>
                <Text size="xl" className="max-w-[38ch] text-pretty">
                    Competitive Bela on a real ELO ladder. Sit down with your
                    usual four, or queue solo and let the rating decide who you
                    get.
                </Text>
                <WaitlistForm
                    id="hero-email"
                    submitLabel="Get early access"
                    buttonTone="forest"
                    inputClassName="sm:w-[280px]"
                />
            </div>

            <MediaPanel
                caption="hero shot — ranked table, mid-hand"
                shadow="rust"
                className="hidden md:aspect-[4/3] md:grid"
            />
        </Section>
    );
}
