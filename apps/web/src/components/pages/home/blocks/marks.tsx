// Flat geometric ornaments for the bento tiles. One shared vocabulary: 3px ink
// outlines, cream fills, nothing rounded except the ring. Colour is carried by
// the tile underneath, never by the mark.

export function BarsMark() {
  return (
    <span aria-hidden className="flex items-end gap-[7px]">
      <span className="h-[44px] w-4 border-[3px] border-ink bg-cream" />
      <span className="h-[68px] w-4 border-[3px] border-ink bg-cream" />
      <span className="h-24 w-4 border-[3px] border-ink bg-ink" />
    </span>
  );
}

export function RingMark() {
  return (
    <span aria-hidden className="size-7 rounded-full border-[3px] border-ink" />
  );
}

export function CardsMark() {
  return (
    <span aria-hidden className="flex items-end gap-2">
      <span className="h-[34px] w-[22px] border-[3px] border-ink bg-cream" />
      <span className="h-[26px] w-10 border-[3px] border-ink bg-cream" />
    </span>
  );
}

export function ReplayMark() {
  return (
    <span aria-hidden className="flex items-end gap-2">
      <span className="size-[22px] rotate-45 border-[3px] border-ink bg-cream" />
      <span className="size-[22px] rotate-45 border-[3px] border-ink bg-ink" />
    </span>
  );
}

export function BalanceMark() {
  return (
    <span aria-hidden className="flex flex-col gap-[7px]">
      <span className="h-2.5 w-[38px] border-[3px] border-ink bg-cream" />
      <span className="h-2.5 w-[38px] border-[3px] border-ink bg-cream" />
    </span>
  );
}
