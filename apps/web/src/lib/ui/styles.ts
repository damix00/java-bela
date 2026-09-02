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

/**
 * Calm feedback while a seat switch resolves: the target seat fades in a rust
 * ring for as long as the request is in flight, then flashes mint once it
 * lands. The transparent base sits unconditionally so `outline-color` fades
 * instead of popping; callers must append this fragment after their own outline
 * classes for the tone to win.
 */
export function swapRing(status?: "pending" | "complete"): string {
    const tone =
        status === "pending"
            ? "outline-rust"
            : status === "complete"
              ? "outline-mint"
              : "";
    return `outline-4 outline-offset-2 outline-transparent transition-[outline-color] duration-200 ${tone}`;
}

// Fields. The ink frame is the same 4px rule the cards and buttons are drawn
// with, so a control reads as another block on the page rather than a widget
// borrowed from the browser. Two shapes: `inputBox` is a field that owns its
// own frame, `inputBare` is one that has been dropped inside `inputFrame`
// alongside something else — a reveal toggle, an availability note — so the
// pair reads as a single welded control.
const inputType = "rounded-none font-sans text-[17px] text-ink outline-none";

// A rejected field is redrawn in rust rather than badged: the frame is the
// loudest thing about these controls, so recolouring it is the cheapest way to
// point at the one field that needs attention. The frame version has to reach
// for the flag on the input it wraps, since that is where `aria-invalid` sits.
const invalidBorder = "aria-invalid:border-rust";
const invalidBorderWithin = "has-aria-invalid:border-rust";

/** Field that draws its own frame. */
export const inputBox = `${inputType} ${invalidBorder} w-full border-4 border-ink px-5 py-4 focus:bg-paper`;

/** Frame around a field plus whatever sits next to it. */
export const inputFrame = `${invalidBorderWithin} flex items-center border-4 border-ink bg-white focus-within:bg-paper`;

/** Field inside an `inputFrame` — the frame is already drawn around it. */
export const inputBare = `${inputType} w-full min-w-0 border-none bg-transparent px-5 py-4`;

/**
 * Diagonal canvas weave used behind screenshot placeholders. Both stripes are
 * palette tokens — the weave is the page's two darkest neutrals against each
 * other, not a pair of one-off greys that read as a surface of their own.
 */
export const hatch =
    "bg-[repeating-linear-gradient(45deg,var(--color-canvas)_0_10px,var(--color-sage)_10px_20px)]";

/**
 * The signed-in surfaces' horizontal frame, shared by the top bar, the lobby
 * and the tables.
 *
 * These are `Section`'s gutters from `sm` up, to the pixel and with no cap on
 * top of them, which is the whole point: the marketing page's bands stop at
 * 288px from each edge and stay there for ever, so anything that wants to line
 * up with them has to stop in the same place. A `max-width` centred inside the
 * same padding looks identical up to about 1480px and then quietly drifts
 * inward — which is exactly the width a 14" laptop opens at.
 *
 * The phone tier is the one place they part. `Section` sets bands of prose,
 * where 32px a side is a margin; these screens set a table, where the same
 * 32px is 18% of a 360px viewport taken off the seats before they are drawn.
 *
 * Blocks that shouldn't grow past a point cap themselves, at their own width.
 */
export const appGutters = "px-4 sm:px-8 md:px-28 lg:px-48 xl:px-72";

/**
 * The table's surface, under everything the lobby lays on it.
 *
 * The lobby is one screen and deliberately holds only two things — the seats
 * and the button that fills them — so most of the viewport is bare baize. Bare
 * flat colour reads as a page that failed to load; felt reads as a table. The
 * weave that does that is a pair of hairline gradients at right angles, and it
 * is the whole texture — no vignette. A lit centre biases the eye toward the
 * middle of the *viewport*, which is not where the seats are at every width,
 * and on a wide screen it reads as a spotlight rather than as cloth.
 *
 * The weave is far below the 4.5:1 floor's notice — it moves `baize` by
 * fractions of a percent — so text tuned against `--color-baize` stays tuned.
 *
 * The `data-felt` marker it carries is what the root layout's `has-` variant
 * looks for: the body is cream for the marketing pages and the documents, and a
 * felt surface that stops at its own box leaves that cream showing wherever the
 * layout reserves space it doesn't paint — under the phone's bottom bar, and in
 * the overscroll bounce past either end of the scroll. Matching the body to
 * whatever surface the page put down closes both without either layout having
 * to know about the other.
 */
export const felt =
    "bg-baize bg-[repeating-linear-gradient(45deg,rgb(255_255_255_/_0.014)_0_2px,transparent_2px_4px),repeating-linear-gradient(-45deg,rgb(0_0_0_/_0.02)_0_2px,transparent_2px_4px)]";

// The felt's own idiom, which the game route worked out first and kept to
// itself: for a long time these were string literals copy-pasted between
// `pages/game/**`, and the identical `0 12px 36px -10px` shadow lived in three
// separate files. They are named here because the rest of the app now speaks
// this language too, and two halves of one idiom drift the moment they are
// written down twice.
//
// The whole system is one surface (`felt`), one block colour laid on it
// (`baize-deep`), and three weights of the same soft shadow. Nothing here draws
// a frame: the neo-brutalist half of the app is built from 4px ink borders, and
// this half is built from the absence of them — a block on the felt is told
// apart from the felt by being darker and by casting a shadow, the way a card
// lying on a table is.

/**
 * Which of the two visual languages a block is drawn in.
 *
 * `brut` is the marketing page's: cream on ink, a 4px frame, a hard offset
 * shadow, and a press that slides the block against it. `felt` is the game
 * table's: a darker block on the baize, no frame at all, a soft shadow, and a
 * press that dips.
 *
 * `brut` stays every primitive's default, so the documents and the landing page
 * keep what they have without passing anything; every signed-in surface asks
 * for `felt`.
 */
export type Surface = "brut" | "felt";

// Concentric corners.
//
// A rounded block sitting inside another one has to take the outer radius
// *minus* the padding between them. Give both the same radius and the two
// curves run at different rates: along the edges the gap is the padding, and at
// the corner it opens up to roughly 1.4× that, so the inner block reads as
// floating away from the corner it is supposed to be nested into. Give the
// inner one more than the outer and it visibly pokes out of the turn.
//
// So the outer radius is derived, not chosen: pick the radius the inner block
// wants, add the padding, and that is what the wrapper gets. Where the padding
// steps at a breakpoint the radius has to step with it, which is why the
// wrappers below spell out a radius per breakpoint rather than taking `panel`'s.
//
// A circle is exempt — `rounded-full` is concentric with anything — which is
// why the pills and the avatars can sit in any of these without arithmetic.
//
// It only binds where the nesting is tight: the lobby band's 12px padding
// around 12px blocks, the stage's 6px around its felt. Once the padding is
// wider than the radius — a form at `p-5`, an auth card at `p-10` — the corners
// are far enough apart that the eye stops pairing them, and the arithmetic
// starts asking for a 40px radius on a panel that wants to look like paper.
// Those keep `panel`'s own 16px.

/**
 * A block laid on the felt: the top bar, a seat, a tray, a card.
 *
 * The mid shadow, which is what most things want. `panelNested` is for a block
 * inside one of these — it is already sitting on `baize-deep`, so it needs less
 * shadow to lift off it — and `panelRaised` is for anything that has to read as
 * being over the whole screen rather than on it.
 */
export const panel =
    "rounded-2xl bg-baize-deep shadow-[0_6px_20px_-8px_rgb(0_0_0_/_0.5)]";

/** A block inside a `panel`. Smaller corner, shorter shadow. */
export const panelNested =
    "rounded-xl bg-baize-deep shadow-[0_4px_14px_-6px_rgb(0_0_0_/_0.5)]";

/** A block over the screen: a dialog, the game-over verdict. */
export const panelRaised =
    "rounded-2xl bg-baize-deep shadow-[0_12px_36px_-10px_rgb(0_0_0_/_0.6)]";

/**
 * The rule between two rows of one block.
 *
 * A hairline, not the 4px ink rule the documents use: on the felt the rows are
 * already the same colour as each other and the block is already darker than
 * the field, so the rule is only there to say where one row ends. Anything
 * heavier reads as two blocks that happen to be touching.
 */
export const hairline = "border-mint/15";

/**
 * The quiet outline — a field's edge, a chip, anything that needs to be found
 * without being announced. A ring rather than a border so it costs no layout
 * and can be thickened on focus without the block resizing.
 */
export const edge = "ring-1 ring-mint/20";

// One entrance for everything that arrives over the page.
//
// There used to be two: the modal shell rose on a 220ms tween and every popup
// the game route wrote for itself rose on a spring, so two dialogs opened by
// the same press — the invite panel and the trump call — did not move alike.
// The spring won because it was already the majority and because it settles
// rather than stops, which is what a block landing on a table does.
//
// Held here rather than in each popup so the next one cannot invent a third.

/** The curve every popup enters and leaves on. */
export const popTransition = {
    type: "spring",
    stiffness: 500,
    damping: 38,
    mass: 0.65,
} as const;

/** Where a popup comes from: below, and a shade smaller. */
export const popEnterFrom = { opacity: 0, scale: 0.96, y: 12 } as const;

/** Where it settles. */
export const popEnterTo = { opacity: 1, scale: 1, y: 0 } as const;

/**
 * Where it goes. A shorter trip than the entrance on purpose — an exit that
 * retraces the arrival reads as a mistake being undone.
 */
export const popExitTo = { opacity: 0, scale: 0.98, y: 6 } as const;

/**
 * The backdrop's fade, in milliseconds, mirrored by the `.modal-shell`
 * `::backdrop` rules in `globals.css`.
 *
 * The dim is CSS and the panel is Motion — the two halves of one entrance in
 * two languages — because a `::backdrop` has no node to hand Motion and the
 * `fixed` div that stood in for one turned out to be the cause of both bugs
 * this pairing replaced (see `Modal`). These constants are what keep the two
 * in step: the close path waits `POP_OUT_MS` for the dim before it navigates.
 */
export const POP_IN_MS = 220;
export const POP_OUT_MS = 140;

// Where a block sits in the lobby band's row, and therefore which of its
// corners face out.
//
// The concentric rule above fixes the inner radius at 12px on every tier
// (24−12, 20−8, 28−16), but it only says what the *outer* corners of the row
// owe the band around them. Left to itself that gives three separate blocks
// each curving away from its neighbours, which is what made the band read as
// three unrelated widgets. Holding the outer corners at the concentric 12px
// and tightening every interior one to 8px turns the row back into a single
// run: the silhouette follows the band, and the seams inside it are seams.
//
// The row is one stacked column until `desk`, so which corners are "outer"
// changes with the layout — hence a pair per tier rather than a single side.
// Spelled out one corner at a time rather than by side. `rounded-t-*` and
// `rounded-l-*` both claim the top-left, and neither Tailwind's output order
// nor `twMerge` resolves that pair — which of the two won would be an accident.
export const bandCell = {
    /** First in the row: outer at the top stacked, on the left as a row. */
    start: "rounded-tl-xl rounded-tr-xl rounded-bl-lg rounded-br-lg desk:rounded-tr-lg desk:rounded-bl-xl",
    /** Surrounded on both sides, whichever way the row runs. */
    middle: "rounded-lg",
    /** Last in the row: outer at the bottom stacked, on the right as a row. */
    end: "rounded-tl-lg rounded-tr-lg rounded-bl-xl rounded-br-xl desk:rounded-tr-xl desk:rounded-bl-lg",
} as const;

/**
 * The felt's press, and the counterpart to `pressSm`/`pressMd`/`pressLg`.
 *
 * Those slide a block against its own hard shadow, which needs a hard shadow to
 * slide against. Nothing here has one, so a press dips instead: the block
 * shrinks fractionally under the finger and comes back. Same 100ms, same
 * two-state feel, no silhouette to preserve.
 */
export const dip =
    "transition-transform duration-100 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100";

// Fields on the felt, mirroring `inputBox`/`inputFrame`/`inputBare` above one
// for one so a control can be moved between the two surfaces by swapping which
// trio it reaches for.
//
// The frame is a ring in mint rather than a border in ink, and it thickens on
// focus instead of changing colour — on a dark field a colour change is most of
// what a border can say, and it is already being spent on the rejected state.
const feltInputType =
    "rounded-xl font-sans text-[17px] text-cream placeholder:text-mint/40 outline-none";
const feltInvalidRing = "aria-invalid:ring-rust";
const feltInvalidRingWithin = "has-aria-invalid:ring-rust";

/** Field that draws its own edge. */
export const feltInputBox = `${feltInputType} ${edge} ${feltInvalidRing} w-full bg-baize-deep px-5 py-4 focus:ring-2 focus:ring-mint/50`;

/** Edge around a field plus whatever sits next to it. */
export const feltInputFrame = `${edge} ${feltInvalidRingWithin} flex items-center rounded-xl bg-baize-deep focus-within:ring-2 focus-within:ring-mint/50`;

/** Field inside a `feltInputFrame` — the edge is already drawn around it. */
export const feltInputBare = `${feltInputType} w-full min-w-0 bg-transparent px-5 py-4`;
