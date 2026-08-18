/**
 * The same closing act as `../page.tsx`, for every route deeper than `/[lang]`.
 * The intercepted `(.)sign-in` and `(.)sign-up` segments are more specific than
 * this catch-all, so they still win where they apply.
 */
export default function CatchAll() {
  return null;
}
