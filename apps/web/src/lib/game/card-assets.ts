import { Rank, Suite } from "@bela/protocol";

const CARD_ASSET_ROOT = "/cards/hungarian";

/**
 * Keep prefetches and rendered cards on the same responsive image candidates.
 * The browser can then reuse the optimized file selected for its viewport and
 * pixel density instead of caching a different rendition in the background.
 */
export const HUNGARIAN_CARD_IMAGE_SIZES =
    "(max-height: 560px) 68px, (min-width: 640px) 112px, calc((100vw - 3rem) / 4)";

const suitMetadata = {
    [Suite.HEARTS]: { folder: "hearts", label: "hearts" },
    [Suite.BELLS]: { folder: "bells", label: "bells" },
    [Suite.ACORN]: { folder: "acorn", label: "acorns" },
    [Suite.LEAF]: { folder: "leaf", label: "leaves" },
} as const satisfies Record<Suite, { folder: string; label: string }>;

const rankMetadata = {
    [Rank.SEVEN]: { file: "seven", label: "seven" },
    [Rank.EIGHT]: { file: "eight", label: "eight" },
    [Rank.NINE]: { file: "nine", label: "nine" },
    [Rank.TEN]: { file: "ten", label: "ten" },
    [Rank.JACK]: { file: "jack", label: "Unter" },
    [Rank.QUEEN]: { file: "queen", label: "Ober" },
    [Rank.KING]: { file: "king", label: "king" },
    [Rank.ACE]: { file: "ace", label: "ace" },
} as const satisfies Record<Rank, { file: string; label: string }>;

export interface HungarianCardAsset {
    id: `${Suite}:${Rank}`;
    suite: Suite;
    rank: Rank;
    src: string;
    alt: string;
}

const suites = Object.values(Suite);
const ranks = Object.values(Rank);

/** All 32 cards in API enum order, ready for rendering or preloading. */
export const HUNGARIAN_CARD_ASSETS: readonly HungarianCardAsset[] = suites.flatMap(
    (suite) =>
        ranks.map((rank) => {
            const suit = suitMetadata[suite];
            const cardRank = rankMetadata[rank];

            return {
                id: `${suite}:${rank}`,
                suite,
                rank,
                src: `${CARD_ASSET_ROOT}/${suit.folder}/${cardRank.file}.png`,
                alt: `${cardRank.label} of ${suit.label}`,
            };
        }),
);

const cardAssetById = new Map(
    HUNGARIAN_CARD_ASSETS.map((asset) => [asset.id, asset]),
);

/** Resolve a backend card's enums to its public image asset. */
export function getHungarianCardAsset(
    suite: Suite,
    rank: Rank,
): HungarianCardAsset {
    const asset = cardAssetById.get(`${suite}:${rank}`);

    if (!asset) {
        throw new Error(`Missing Hungarian card asset for ${suite}:${rank}`);
    }

    return asset;
}

export const HUNGARIAN_CARD_BACK_ASSET = `${CARD_ASSET_ROOT}/back.svg`;

export const HUNGARIAN_SUIT_ASSETS = {
    [Suite.HEARTS]: `${CARD_ASSET_ROOT}/suits/hearts.png`,
    [Suite.BELLS]: `${CARD_ASSET_ROOT}/suits/bells.png`,
    [Suite.ACORN]: `${CARD_ASSET_ROOT}/suits/acorn.png`,
    [Suite.LEAF]: `${CARD_ASSET_ROOT}/suits/leaf.png`,
} as const satisfies Record<Suite, string>;
