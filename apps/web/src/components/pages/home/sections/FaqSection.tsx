import FaqItem from "@/components/pages/home/blocks/FaqItem";
import DividedPanel from "@/components/ui/surfaces/DividedPanel";
import Heading from "@/components/ui/typography/Heading";
import Section from "@/components/layout/Section";

const faqs = [
    {
        question: "Is it free?",
        answer: "All of it. No ads, nothing to buy.",
    },
    {
        question: "Do my friends need an account?",
        answer: "No — only the host.",
    },
    {
        question: "What if someone disconnects?",
        answer: "The hand pauses. Rejoin from any device.",
    },
    {
        question: "Can I play offline?",
        answer: "Yes, against the AI.",
    },
];

export default function FaqSection() {
    return (
        <Section
            id="faq"
            tone="sage"
            className="grid gap-14 lg:grid-cols-[1fr_1.25fr]">
            <Heading>Questions before you sit down</Heading>
            <DividedPanel>
                {faqs.map((faq) => (
                    <FaqItem key={faq.question} question={faq.question}>
                        {faq.answer}
                    </FaqItem>
                ))}
            </DividedPanel>
        </Section>
    );
}
