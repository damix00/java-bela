import Card from "@/components/ui/surfaces/Card";
import Eyebrow from "@/components/ui/typography/Eyebrow";
import { cn } from "@/lib/cn";

type PlacementCardProps = {
  label: string;
  played: number;
  total: number;
  /** Inline puts the count and its caption on one line, for narrow cards. */
  layout?: "stacked" | "inline";
  className?: string;
};

/** Placement hands played, as a count and as one pip per hand. */
export default function PlacementCard({
  label,
  played,
  total,
  layout = "stacked",
  className,
}: PlacementCardProps) {
  const count = (
    <span className="font-display text-[38px] leading-none font-extrabold tracking-[-.04em] text-ink sm:text-[56px]">
      {played} / {total}
    </span>
  );

  return (
    <Card
      padding="none"
      shadow="ink"
      className={cn("px-[30px] py-[26px]", className)}
    >
      {layout === "inline" ? (
        <span className="flex flex-wrap items-baseline gap-3">
          {count}
          <Eyebrow className="font-normal">{label}</Eyebrow>
        </span>
      ) : (
        <>
          <Eyebrow className="font-normal">{label}</Eyebrow>
          {count}
        </>
      )}
      <span className="flex gap-[7px] pt-2.5">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            aria-hidden
            className={cn(
              "h-3 w-[22px] border-[3px] border-ink",
              index < played ? "bg-forest" : "bg-canvas",
            )}
          />
        ))}
      </span>
    </Card>
  );
}
