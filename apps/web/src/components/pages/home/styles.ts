// Utility bundles reused across the page — the neo-brutalist blocks all share
// one hover behaviour (slide toward their own hard shadow) and one link style.
export const lift =
  "transition-transform duration-[120ms] hover:-translate-x-[3px] hover:-translate-y-[3px] motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0";

export const underline =
  "no-underline hover:underline hover:decoration-[3px] hover:underline-offset-[5px]";

export const hatch =
  "bg-[repeating-linear-gradient(45deg,#dcd9c6_0_10px,#e6e3d2_10px_20px)]";

export const card = "border-4 border-ink shadow-hard-lg p-[26px] flex flex-col";
