// Class fragments shared by the visual primitives in `components/ui` and the
// interactive ones in `components/controls`.

// Press physics, taken from the reference build's `.px-btn`. The block moves
// against its own shadow and the shadow changes by the same amount in the
// opposite direction, so the outer silhouette never resizes: on hover the block
// lifts up-left off a longer shadow, on press it sinks down-right onto a
// shorter one. Because the silhouette never grows, the shadow can't read as a
// slab sitting apart from the button.
//
// Travel is half the resting shadow — the reference's ratio (rest 4px, ±2px),
// not its literal pixel count, which on this heavier scale would barely
// register as a press:
//
//   scale   rest   travel   hover   active
//   sm      5px    2px      7px     3px
//   md      6px    3px      9px     3px
//   lg      8px    4px      12px    4px
//
// Stepped easing over 80ms, also from the reference: the state change lands in
// two hard frames rather than gliding.
//
// Every class below is spelled out per scale on purpose. Tailwind scans source
// text for complete class names, so a string built as `after:-right-[${t}px]`
// would never be generated.

// A moving block drags its own hover target along with it: the bottom and right
// edges retreat from under the cursor, the pointer lands on bare shadow, and the
// block oscillates between hover and rest at frame rate. These transparent
// overhangs pin the hit area in place, so the pointer stays inside the element
// for the whole slide. As a bonus the resting block picks up its own shadow as
// hover surface, which removes the dead band there.
//
// The overhang is `border + travel`, not just travel: an absolutely positioned
// pseudo-element resolves its offsets against the *padding* box, so anything
// less than the border width doesn't even reach the element's own edge. Only
// the bottom and right are extended — those are the edges that retreat on
// hover. (On press the top-left retreats instead, but a held button keeps
// `:active` regardless of the pointer, and `:active` is what's being shown.)
const hitAreaBase =
  "relative after:absolute after:top-0 after:left-0 after:content-['']";
/** 3px border + 2px travel. */
const hitAreaSm = `${hitAreaBase} after:-right-[5px] after:-bottom-[5px]`;
/** 4px border + 3px travel. */
const hitAreaMd = `${hitAreaBase} after:-right-[7px] after:-bottom-[7px]`;
/** 4px border + 4px travel. */
const hitAreaLg = `${hitAreaBase} after:-right-[8px] after:-bottom-[8px]`;

/**
 * Hit-area overhang on its own, for a button that is welded into a larger block
 * (see `WaitlistForm`): the wrapper moves, but the button is what gets hovered,
 * so the button still needs the stabiliser.
 */
export const hitAreaJoined = hitAreaMd;

// `translate`, not `transform`: Tailwind's translate utilities compile to the
// standalone `translate` property, so a transition naming `transform` leaves the
// block snapping instantly while only its shadow steps — the two halves of the
// effect come apart.
const pressBase =
  "transition-[translate,box-shadow] duration-[80ms] ease-[steps(2)] motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 motion-reduce:active:translate-x-0 motion-reduce:active:translate-y-0";

/** Press physics for a 5px-shadow block. */
export const pressSm = `${hitAreaSm} ${pressBase} hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[7px_7px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[3px_3px_0_var(--color-ink)]`;

/** Press physics for a 6px-shadow block. */
export const pressMd = `${hitAreaMd} ${pressBase} hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[9px_9px_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[3px_3px_0_var(--color-ink)]`;

/** Press physics for an 8px-shadow block. */
export const pressLg = `${hitAreaLg} ${pressBase} hover:-translate-x-[4px] hover:-translate-y-[4px] hover:shadow-[12px_12px_0_var(--color-ink)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-[4px_4px_0_var(--color-ink)]`;

/**
 * The `md` physics, owned by a block whose button is only one part of it. The
 * pressed state is marked important because Tailwind emits these two arbitrary
 * variants in alphabetical order — `active` lands before `hover`, and a press
 * is also a hover, so it would otherwise never win.
 */
export const pressOnButton =
  "transition-[translate,box-shadow] duration-[80ms] ease-[steps(2)] has-[button:hover]:-translate-x-[3px] has-[button:hover]:-translate-y-[3px] has-[button:hover]:shadow-[9px_9px_0_var(--color-ink)] has-[button:active]:translate-x-[3px]! has-[button:active]:translate-y-[3px]! has-[button:active]:shadow-[3px_3px_0_var(--color-ink)]! motion-reduce:transition-none motion-reduce:has-[button:hover]:translate-x-0 motion-reduce:has-[button:hover]:translate-y-0 motion-reduce:has-[button:active]:translate-x-0! motion-reduce:has-[button:active]:translate-y-0!";

/** Thick offset outline, matching the 4px ink borders. */
export const focusRing =
  "focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-rust";

/** Diagonal canvas weave used behind screenshot placeholders. */
export const hatch =
  "bg-[repeating-linear-gradient(45deg,#dcd9c6_0_10px,#e6e3d2_10px_20px)]";
