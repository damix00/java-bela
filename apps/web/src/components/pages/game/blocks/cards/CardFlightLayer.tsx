"use client";

import {
    motion,
    useAnimationControls,
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

function FlightCard({
    flight,
    rootRef,
    onComplete,
}: {
    flight: CardFlight;
    rootRef: RefObject<HTMLElement | null>;
    onComplete: CardFlightLayerProps["onComplete"];
}) {
    const controls = useAnimationControls();
    const { source } = flight;

    useLayoutEffect(() => {
        let frame = 0;
        let cancelled = false;

        const finish = () => {
            if (!cancelled) onComplete(flight.id, flight.returning);
        };

        const run = () => {
            if (flight.returning) {
                void controls
                    .start({
                        x: source.left,
                        y: source.top,
                        width: source.width,
                        height: source.height,
                        rotate: flight.rotation,
                        scale: 1,
                        transition: flightSpring,
                    })
                    .then(finish);
                return;
            }

            const root = rootRef.current;
            const destination = root
                ? destinationFor(root, flight.playerIndex)
                : null;

            // The first card can switch the centre from a status panel to the
            // trick in the same socket turn. Wait for that slot rather than
            // guessing where it will be and landing a frame off-centre.
            if (!destination) {
                frame = requestAnimationFrame(run);
                return;
            }

            void controls
                .start({
                    x: destination.left,
                    y: destination.top,
                    width: destination.width,
                    height: destination.height,
                    rotate: flight.landingRotation,
                    scale: 1,
                    transition: flightSpring,
                })
                .then(finish);
        };

        run();

        return () => {
            cancelled = true;
            cancelAnimationFrame(frame);
            controls.stop();
        };
    }, [
        controls,
        flight.id,
        flight.landingRotation,
        flight.playerIndex,
        flight.returning,
        flight.rotation,
        onComplete,
        rootRef,
        source.height,
        source.left,
        source.top,
        source.width,
    ]);

    return (
        <motion.div
            initial={{
                x: source.left,
                y: source.top,
                width: source.width,
                height: source.height,
                rotate: flight.rotation,
                scale: 1.035,
            }}
            animate={controls}
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
