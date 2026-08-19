/**
 * The slot's resting state. Without this, a hard load of any route that isn't
 * one of the intercepted ones would have no component to render for `@modal`
 * and 404 the whole page.
 */
export default function Default() {
    return null;
}
