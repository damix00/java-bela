"use client";

import {
    animate,
    motion,
    useMotionValue,
    type Transition,
} from "motion/react";
import { useLayoutEffect, type RefObject } from "react";
import type { Card } from "@bela/protocol";

import PlayingCard, { type CardOrigin } from "@/components/pages/game/blocks/cards/PlayingCard";

export type CardFlight = {
    id: number;
    key: string;
    card: Card;
    playerIndex: number;
    roundNumber: number;
    trickNumber: number;
    connectionEpoch: number;
    source: CardOrigin;
    rotation: number;
    landingRotation: number;
    local: boolean;
    confirmed: boolean;
    landed: boolean;
    returning: boolean;
    reduced: boolean;
};

type CardFlightLayerProps = {
    flights: CardFlight[];
    rootRef: RefObject<HTMLElement | null>;
    onComplete: (id: number, returning: boolean) => void;
};

const flightSpring: Transition = {
    type: "spring",
    stiffness: 380,
    damping: 38,
    mass: 0.85,
};

const instant: Transition = { duration: 0 };

function destinationFor(
    root: HTMLElement,
    playerIndex: number,
): CardOrigin | null {
    const element = root.querySelector<HTMLElement>(
        `[data-card-destination="${playerIndex}"]`,
    );
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
    };
}

function moved(a: CardOrigin, b: CardOrigin) {
    return (
        Math.abs(a.left - b.left) > 0.5 ||
        Math.abs(a.top - b.top) > 0.5 ||
        Math.abs(a.width - b.width) > 0.5 ||
        Math.abs(a.height - b.height) > 0.5
    );
}

function FlightCard({
    flight,
    rootRef,
    onComplete,
}: {
    flight: CardFlight;
    rootRef: RefObject<HTMLElement | null>;
    onComplete: CardFlightLayerProps["onComplete"];
}) {
    const { source } = flight;

    const x = useMotionValue(source.left);
    const y = useMotionValue(source.top);
    const width = useMotionValue(source.width);
    const height = useMotionValue(source.height);
    const rotate = useMotionValue(flight.rotation);
    const scale = useMotionValue(1.035);

    useLayoutEffect(() => {
        let cancelled = false;
        let frame = 0;
        let generation = 0;
        let started = false;
        let arrived = false;
        let target: CardOrigin | null = null;

        const finish = () => {
            if (cancelled || arrived) return;
            arrived = true;
            onComplete(flight.id, flight.returning);
        };

        // Retargeting rather than replaying: the slot the card is heading for
        // moves whenever the layout under it does — most visibly when the hand
        // drops a row and the table takes the height back. A flight aimed at
        // the rect measured on take-off would land beside the trick, and a
        // card that has already landed would sit there while the pile slid out
        // from under it.
        const aim = (destination: CardOrigin) => {
            const transition = arrived ? instant : flightSpring;
            const run = ++generation;

            // Every property has to land before the card is done travelling.
            // Watching one of them is not enough: the across seat sits directly
            // over its slot, so its x barely moves, finishes on the first frame,
            // and would end the flight while the card was still falling.
            const legs = [
                animate(x, destination.left, transition),
                animate(y, destination.top, transition),
                animate(width, destination.width, transition),
                animate(height, destination.height, transition),
            ];

            void Promise.all(legs).then(
                () => {
                    // Only the newest run may report arrival; a retarget stops
                    // the previous run, whose promise settles all the same.
                    if (run === generation) finish();
                },
                () => {},
            );
        };

        const tick = () => {
            if (cancelled) return;

            const root = rootRef.current;
            const destination = flight.returning
                ? source
                : root
                  ? destinationFor(root, flight.playerIndex)
                  : null;

            // The first card can switch the centre from a status panel to the
            // trick in the same socket turn. Wait for that slot rather than
            // guessing where it will be and landing a frame off-centre.
            if (destination) {
                if (!target || moved(target, destination)) {
                    target = destination;
                    aim(destination);
                }

                if (!started) {
                    started = true;
                    animate(
                        rotate,
                        flight.returning
                            ? flight.rotation
                            : flight.landingRotation,
                        flightSpring,
                    );
                    animate(scale, 1, flightSpring);
                }
            }

            frame = requestAnimationFrame(tick);
        };

        tick();

        return () => {
            cancelled = true;
            cancelAnimationFrame(frame);
        };
    }, [
        flight.id,
        flight.landingRotation,
        flight.playerIndex,
        flight.returning,
        flight.rotation,
        height,
        onComplete,
        rootRef,
        rotate,
        scale,
        source,
        width,
        x,
        y,
    ]);

    return (
        <motion.div
            style={{ x, y, width, height, rotate, scale }}
            className="fixed top-0 left-0 z-0 origin-center will-change-transform"
        >
            <PlayingCard card={flight.card} size="sm" className="w-full" />
        </motion.div>
    );
}

/** Cards travel above the screen furniture, never inside an overflow clip. */
export default function CardFlightLayer({
    flights,
    rootRef,
    onComplete,
}: CardFlightLayerProps) {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-[35] overflow-visible"
        >
            {flights.map((flight) => (
                <FlightCard
                    key={flight.id}
                    flight={flight}
                    rootRef={rootRef}
                    onComplete={onComplete}
                />
            ))}
        </div>
    );
}
