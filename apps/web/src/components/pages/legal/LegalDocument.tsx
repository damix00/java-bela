import Section from "@/components/layout/Section";
import Chip from "@/components/ui/surfaces/Chip";
import DividedPanel from "@/components/ui/surfaces/DividedPanel";
import Eyebrow from "@/components/ui/typography/Eyebrow";
import Heading from "@/components/ui/typography/Heading";
import ProseList from "@/components/ui/typography/ProseList";
import Text from "@/components/ui/typography/Text";
import TextLink from "@/components/ui/typography/TextLink";
import type {
  LegalBlock,
  LegalDocument as LegalDoc,
} from "@/content/legal/types";

/** Reading measure. Legal prose is long; the gutters alone don't cap the line. */
const MEASURE = "max-w-[68ch]";

function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case "p":
      return (
        <Text size="md" tone="ink" className={MEASURE}>
          {block.text}
        </Text>
      );
    case "list":
      return <ProseList items={block.items} className={MEASURE} />;
    case "rows":
      // A real <table> would have to scroll sideways on a phone. Stacked rows
      // in a ruled panel carry the same pairing and never overflow.
      return (
        <DividedPanel className={MEASURE}>
          {block.rows.map((row, index) => (
            <div key={index} className="flex flex-col gap-2 p-5">
              <Eyebrow as="p">{row.label}</Eyebrow>
              <Text size="md" tone="ink">
                {row.text}
              </Text>
            </div>
          ))}
        </DividedPanel>
      );
  }
}

/**
 * Renders a legal document from its content module. Sections are numbered here
 * rather than in the copy, so inserting a clause never leaves the prose citing
 * a number that moved — cross-references in the text name their section.
 */
export default function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <Section tone="sage" className="flex flex-col gap-6">
        <Chip className="self-start">
          {doc.updatedLabel}: {doc.updated}
        </Chip>
        <Heading as="h1" size="section">
          {doc.title}
        </Heading>
        <Text size="lg" tone="ink" className={MEASURE}>
          {doc.lede}
        </Text>
        <nav aria-labelledby="toc-label" className="mt-4 flex flex-col gap-3">
          <Eyebrow as="p" id="toc-label">
            {doc.tocLabel}
          </Eyebrow>
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {doc.sections.map((section, index) => (
              <li key={section.id}>
                <TextLink href={`#${section.id}`}>
                  {index + 1}. {section.heading}
                </TextLink>
              </li>
            ))}
          </ol>
        </nav>
      </Section>

      <Section divided={false} className="flex flex-col gap-14">
        {doc.sections.map((section, index) => (
          <article key={section.id} className="flex flex-col gap-5">
            <Heading
              as="h2"
              size="card"
              id={section.id}
              // Clears the sticky header when jumped to from the contents.
              className="scroll-mt-28"
            >
              {index + 1}. {section.heading}
            </Heading>
            {section.blocks.map((block, blockIndex) => (
              <Block key={blockIndex} block={block} />
            ))}
          </article>
        ))}
      </Section>
    </>
  );
}
