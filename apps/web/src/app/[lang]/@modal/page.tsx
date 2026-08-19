/**
 * The slot's match for `/[lang]` itself. `default.tsx` only covers a hard load;
 * on a client-side navigation an unmatched slot keeps whatever it was already
 * showing, so without a route that renders nothing here, signing in from the
 * modal would land in the lobby with the form still floating over it.
 */
export default function Page() {
    return null;
}
