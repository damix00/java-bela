import FaqItem from "@/components/pages/home/blocks/FaqItem";
import DividedPanel from "@/components/ui/surfaces/DividedPanel";
import Heading from "@/components/ui/typography/Heading";
import Section from "@/components/layout/Section";

const faqs = [
  {
    question: "Is it free?",
    answer:
      "Yes. Ranked play, private tables and every variant — no ads and nothing to buy.",
  },
  {
    question: "Do my friends need an account?",
    answer: "Only the host does. Everyone else joins straight from the link.",
  },
  {
    question: "What if someone disconnects?",
    answer:
      "The hand pauses and holds their seat. Rejoin from any device and pick up where you left off.",
  },
  {
    question: "Can I play offline?",
    answer: "Yes — against the AI, with no signal and no queue.",
  },
];

export default function FaqSection() {
  return (
    <Section
      id="faq"
      tone="sage"
      className="grid gap-14 lg:grid-cols-[1fr_1.25fr]"
    >
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
