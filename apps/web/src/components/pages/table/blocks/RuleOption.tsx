import { cn } from "@/lib/cn";

type RuleOptionProps = {
  title: string;
  /** The terms in one line — target score, and what it costs you. */
  note: string;
  selected?: boolean;
};

/**
 * One of the three ways to play. The chosen one is filled rust, the others sit
 * back into the felt — the same accent the rest of the site uses to mark the
 * one option a screen is steering towards.
 */
export default function RuleOption({
  title,
  note,
  selected = false,
}: RuleOptionProps) {
  return (
    <div
      className={cn(
        "border-4 border-ink px-5 py-[18px] shadow-hard",
        selected ? "bg-rust" : "bg-baize-deep",
      )}
    >
      <p className="m-0 font-display text-[19px] font-extrabold tracking-[-.02em] text-cream">
        {title}
      </p>
      <p
        className={cn(
          "m-0 mt-[6px] font-sans text-[12px]",
          selected ? "text-cream/85" : "text-mint/55",
        )}
      >
        {note}
      </p>
    </div>
  );
}
