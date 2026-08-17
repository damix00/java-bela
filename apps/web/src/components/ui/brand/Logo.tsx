import { cn } from "@/lib/cn";

const tones = {
  ink: "text-ink",
  cream: "text-cream",
} as const;

// The badge inverts against whatever it sits on, so the spade always reads.
const markTones = {
  ink: "bg-ink text-cream",
  cream: "bg-cream text-ink",
} as const;

type LogoProps = {
  /** The tilted spade badge only appears where there's room for it. */
  withMark?: boolean;
  tone?: keyof typeof tones;
  className?: string;
};

export default function Logo({
  withMark = false,
  tone = "ink",
  className,
}: LogoProps) {
  return (
    <span className={cn("flex items-center gap-[11px]", className)}>
      {withMark && (
        <span
          aria-hidden
          className={cn(
            "grid size-9 -rotate-6 place-items-center text-[19px]",
            markTones[tone],
          )}
        >
          ♠
        </span>
      )}
      <span
        className={cn(
          "font-display text-[21px] font-extrabold tracking-[-.02em]",
          tones[tone],
        )}
      >
        belote.gg
      </span>
    </span>
  );
}
