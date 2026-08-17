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
//
// The overhang also has to *grow* by the travel on hover. The pseudo-element is
// a child, so it slides along with the block: whatever its resting size, its
// outer edge lands `travel` short of where it sat at rest, leaving a band that
// is hoverable at rest but not once hovered — hover, slide, lose the pointer,
// unhover, slide back, hover again. Adding the travel a second time on hover
// pins that outer edge to the same screen position in both states, so the band
// closes and the hit area only ever gains ground.
const hitAreaBase =
  "relative after:absolute after:top-0 after:left-0 after:content-['']";
/** 3px border + 2px travel, + 2px more to stay put while hovered. */
const hitAreaSm = `${hitAreaBase} after:-right-[5px] after:-bottom-[5px] hover:after:-right-[7px] hover:after:-bottom-[7px]`;
/** 4px border + 3px travel, + 3px more to stay put while hovered. */
const hitAreaMd = `${hitAreaBase} after:-right-[7px] after:-bottom-[7px] hover:after:-right-[10px] hover:after:-bottom-[10px]`;
/** 4px border + 4px travel, + 4px more to stay put while hovered. */
const hitAreaLg = `${hitAreaBase} after:-right-[8px] after:-bottom-[8px] hover:after:-right-[12px] hover:after:-bottom-[12px]`;

/**
 * Hit-area overhang on its own, for a button that is welded into a larger
 * block: the wrapper moves, but the button is what gets hovered, so the button
 * still needs the stabiliser.
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
 * The `md` physics, owned by a block whose button is only one part of it — a
 * field with a submit welded to its edge, say. The
 * pressed state is marked important because Tailwind emits these two arbitrary
 * variants in alphabetical order — `active` lands before `hover`, and a press
 * is also a hover, so it would otherwise never win.
 */
export const pressOnButton =
  "transition-[translate,box-shadow] duration-[80ms] ease-[steps(2)] has-[button:hover]:-translate-x-[3px] has-[button:hover]:-translate-y-[3px] has-[button:hover]:shadow-[9px_9px_0_var(--color-ink)] has-[button:active]:translate-x-[3px]! has-[button:active]:translate-y-[3px]! has-[button:active]:shadow-[3px_3px_0_var(--color-ink)]! motion-reduce:transition-none motion-reduce:has-[button:hover]:translate-x-0 motion-reduce:has-[button:hover]:translate-y-0 motion-reduce:has-[button:active]:translate-x-0! motion-reduce:has-[button:active]:translate-y-0!";

/** Thick offset outline, matching the 4px ink borders. */
export const focusRing =
  "focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-rust";

// Fields. The ink frame is the same 4px rule the cards and buttons are drawn
// with, so a control reads as another block on the page rather than a widget
// borrowed from the browser. Two shapes: `inputBox` is a field that owns its
// own frame, `inputBare` is one that has been dropped inside `inputFrame`
// alongside something else — a reveal toggle, an availability note — so the
// pair reads as a single welded control.
const inputType = "rounded-none font-sans text-[17px] text-ink outline-none";

/** Field that draws its own frame. */
export const inputBox = `${inputType} w-full border-4 border-ink px-5 py-4 focus:bg-paper`;

/** Frame around a field plus whatever sits next to it. */
export const inputFrame =
  "flex items-center border-4 border-ink bg-white focus-within:bg-paper";

/** Field inside an `inputFrame` — the frame is already drawn around it. */
export const inputBare = `${inputType} w-full min-w-0 border-none bg-transparent px-5 py-4`;

/**
 * Diagonal canvas weave used behind screenshot placeholders. Both stripes are
 * palette tokens — the weave is the page's two darkest neutrals against each
 * other, not a pair of one-off greys that read as a surface of their own.
 */
export const hatch =
  "bg-[repeating-linear-gradient(45deg,var(--color-canvas)_0_10px,var(--color-sage)_10px_20px)]";
