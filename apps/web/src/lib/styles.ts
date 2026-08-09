// Class fragments shared by the visual primitives in `components/ui` and the
// interactive ones in `components/controls`.

/** Neo-brutalist hover: the block slides toward its own hard shadow. */
export const lift =
  "transition-transform duration-[120ms] hover:-translate-x-[3px] hover:-translate-y-[3px] motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0";

/** Thick offset outline, matching the 4px ink borders. */
export const focusRing =
  "focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-rust";

/** Diagonal canvas weave used behind screenshot placeholders. */
export const hatch =
  "bg-[repeating-linear-gradient(45deg,#dcd9c6_0_10px,#e6e3d2_10px_20px)]";
