import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";

type FaqItemProps = {
  question: string;
  children: string;
};

export default function FaqItem({ question, children }: FaqItemProps) {
  return (
    <div className="bg-cream px-6 py-[22px]">
      <Heading as="h3" size="label" className="mb-1.5">
        {question}
      </Heading>
      <Text>{children}</Text>
    </div>
  );
}
