/**
 * Liveness probe for the deploy.
 *
 * kamal-proxy will not send traffic to a new container until this answers, so it has to be
 * something stable. Every user-facing path redirects — `/` to the detected locale, `/en` on to
 * sign-in — and health-checking a redirect chain means a routing change can fail a deploy for
 * reasons that have nothing to do with the container being up.
 *
 * Deliberately shallow: it reports that this process is serving requests, nothing more. It does
 * not reach for the API, because the web container being marked unhealthy during an API blip
 * would take down the half of the site that still renders fine.
 */
export const dynamic = "force-dynamic";

export function GET() {
    return Response.json({ status: "ok" });
}
