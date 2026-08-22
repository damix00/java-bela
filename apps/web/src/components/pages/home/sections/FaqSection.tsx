import FaqItem from "@/components/pages/home/blocks/faq/FaqItem";
import DividedPanel from "@/components/ui/surfaces/DividedPanel";
import Heading from "@/components/ui/typography/Heading";
import Section from "@/components/layout/Section";
import type { Dictionary } from "@/dictionaries";

type FaqSectionProps = {
    copy: Dictionary["faq"];
};

export default function FaqSection({ copy }: FaqSectionProps) {
    return (
        <Section
            id="faq"
            tone="sage"
            className="grid gap-14 lg:grid-cols-[1fr_1.25fr]"
        >
            <Heading>{copy.heading}</Heading>
            <DividedPanel>
                {/* Keyed by position: the questions are translated, so the list's
            identity is its order, not its English text. */}
                {copy.items.map((faq, index) => (
                    <FaqItem key={index} question={faq.question}>
                        {faq.answer}
                    </FaqItem>
                ))}
            </DividedPanel>
        </Section>
    );
}
