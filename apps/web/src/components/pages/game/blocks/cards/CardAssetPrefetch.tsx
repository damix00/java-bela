"use client";

import { getImageProps } from "next/image";
import { useEffect } from "react";

import {
    HUNGARIAN_CARD_ASSETS,
    HUNGARIAN_CARD_IMAGE_SIZES,
} from "@/lib/game/card-assets";

type IdleWindow = Window &
    typeof globalThis & {
        requestIdleCallback?: (
            callback: IdleRequestCallback,
            options?: IdleRequestOptions,
        ) => number;
        cancelIdleCallback?: (handle: number) => void;
    };

/**
 * Warm the optimized image cache while the player is in the signed-in app.
 *
 * Each off-screen image receives the same `srcset` and `sizes` as a real card,
 * so the browser selects the rendition it will later render. Loading one at a
 * time and scheduling the next during an idle period keeps the deck behind
 * visible UI and active game traffic.
 */
export default function CardAssetPrefetch() {
    useEffect(() => {
        const idleWindow = window as IdleWindow;
        let cancelled = false;
        let index = 0;
        let scheduledHandle: number | null = null;
        let scheduledWithIdleCallback = false;
        let activeImage: HTMLImageElement | null = null;

        const schedule = (callback: () => void) => {
            if (idleWindow.requestIdleCallback) {
                scheduledWithIdleCallback = true;
                scheduledHandle = idleWindow.requestIdleCallback(callback, {
                    timeout: 1500,
                });
                return;
            }

            scheduledWithIdleCallback = false;
            scheduledHandle = window.setTimeout(callback, 0);
        };

        const prefetchNext = () => {
            scheduledHandle = null;

            if (cancelled || index >= HUNGARIAN_CARD_ASSETS.length) return;

            const asset = HUNGARIAN_CARD_ASSETS[index];
            index += 1;

            const { props } = getImageProps({
                alt: "",
                src: asset.src,
                fill: true,
                sizes: HUNGARIAN_CARD_IMAGE_SIZES,
            });
            const image = new window.Image();
            activeImage = image;
            image.decoding = "async";
            image.fetchPriority = "low";
            image.sizes = props.sizes ?? HUNGARIAN_CARD_IMAGE_SIZES;
            image.srcset = props.srcSet ?? "";

            const continuePrefetch = () => {
                activeImage = null;
                image.onload = null;
                image.onerror = null;

                if (!cancelled) schedule(prefetchNext);
            };

            image.onload = continuePrefetch;
            image.onerror = continuePrefetch;
            image.src = props.src as string;
        };

        schedule(prefetchNext);

        return () => {
            cancelled = true;

            if (scheduledHandle !== null) {
                if (
                    scheduledWithIdleCallback &&
                    idleWindow.cancelIdleCallback
                ) {
                    idleWindow.cancelIdleCallback(scheduledHandle);
                } else {
                    window.clearTimeout(scheduledHandle);
                }
            }

            if (activeImage) {
                activeImage.onload = null;
                activeImage.onerror = null;
                activeImage.src = "";
            }
        };
    }, []);

    return null;
}
