import { cn } from "@/lib/cn";

type StrengthMeterProps = {
  /** Segments filled, out of `segments`. */
  filled: number;
  segments?: number;
  /** Word for the level reached — "strong". */
  label: string;
};

/** Password strength as four boxed bars and one word. */
export default function StrengthMeter({
  filled,
  segments = 4,
  label,
}: StrengthMeterProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: segments }, (_, index) => (
        <span
          key={index}
          aria-hidden
          className={cn(
            "h-3.5 flex-1 border-[3px] border-ink",
            index < filled ? "bg-forest" : "bg-canvas",
          )}
        />
      ))}
      <span className="pl-2 text-[12px] font-semibold text-forest">
        {label}
      </span>
    </div>
  );
}
