import { Rank, Suite, type Card, type PlayedCard } from "@bela/protocol";

/**
 * The rules, as the client understands them.
 *
 * Advisory only. `TrickValidator` on the backend is the authority and refuses an
 * illegal throw whatever this says — what this buys is a hand where the cards
 * you cannot play are visibly dead before you reach for one, rather than a
 * rejection after the fact.
 *
 * Points are recomputed here from the rank rather than read off `Card.points`.
 * The wire type carries `points`, `strength` and `trump`, but those are resolved
 * against whatever the trump suit was when that particular card instance was
 * serialised — and the cards in a trick arrive from several different events.
 * The rank tables plus the trump suite we were told about are self-contained.
 */

const NORMAL_POINTS: Record<Rank, number> = {
    [Rank.SEVEN]: 0,
    [Rank.EIGHT]: 0,
    [Rank.NINE]: 0,
    [Rank.TEN]: 10,
    [Rank.JACK]: 2,
    [Rank.QUEEN]: 3,
    [Rank.KING]: 4,
    [Rank.ACE]: 11,
};

/** In trump the Jack and the Nine jump the order — `Rank` on the backend agrees. */
const TRUMP_POINTS: Record<Rank, number> = {
    ...NORMAL_POINTS,
    [Rank.NINE]: 14,
    [Rank.JACK]: 20,
};

/** A stable identity for a card, for keys and set membership. */
export function cardKey(card: Pick<Card, "suite" | "rank">) {
    return `${card.suite}-${card.rank}`;
}

export function sameCard(
    a: Pick<Card, "suite" | "rank">,
    b: Pick<Card, "suite" | "rank">,
) {
    return a.suite === b.suite && a.rank === b.rank;
}

export function isTrump(card: Card, trumpSuite: Suite | null) {
    return trumpSuite ? card.suite === trumpSuite : card.trump;
}

function pointsOf(card: Card, trumpSuite: Suite | null) {
    return isTrump(card, trumpSuite)
        ? TRUMP_POINTS[card.rank]
        : NORMAL_POINTS[card.rank];
}

/**
 * Whether `card` beats `previous`.
 *
 * Only comparable within a suit, or across the trump boundary — two different
 * non-trump suits never beat each other, which is why this answers false rather
 * than comparing their points.
 */
function isStrongerThan(card: Card, previous: Card, trumpSuite: Suite | null) {
    const cardIsTrump = isTrump(card, trumpSuite);
    const previousIsTrump = isTrump(previous, trumpSuite);

    if (cardIsTrump && !previousIsTrump) return true;
    if (!cardIsTrump && previousIsTrump) return false;

    if (card.suite === previous.suite) {
        return pointsOf(card, trumpSuite) > pointsOf(previous, trumpSuite);
    }

    return false;
}

function hasSuite(hand: Card[], suite: Suite) {
    return hand.some((card) => card.suite === suite);
}

function hasStrongerInSuite(
    hand: Card[],
    card: Card,
    suite: Suite,
    trumpSuite: Suite | null,
) {
    return hand.some(
        (held) => held.suite === suite && isStrongerThan(held, card, trumpSuite),
    );
}

/**
 * Bela is the trump King and Queen as a pair, worth 20, and only if it is
 * declared as the second of the two is played.
 *
 * Worth prompting for only when the pair can actually be completed: the partner
 * card is either still in hand, or this player already played it earlier in the
 * round. Anything else and the prompt is offering points that cannot be scored.
 */
export function canDeclareBela(
    card: Card,
    trumpSuite: Suite | null,
    hand: Card[],
    myPlayedCards: Card[],
) {
    if (!isTrump(card, trumpSuite)) return false;
    if (card.rank !== Rank.KING && card.rank !== Rank.QUEEN) return false;

    const partnerRank = card.rank === Rank.KING ? Rank.QUEEN : Rank.KING;
    const isPartner = (candidate: Card) =>
        candidate.suite === card.suite && candidate.rank === partnerRank;

    return hand.some(isPartner) || myPlayedCards.some(isPartner);
}

/**
 * Whether a card may be thrown into the trick in progress.
 *
 * Bela's obligations, in the order they apply: follow the led suit; while
 * following, beat the standing card if you can, unless the trick has already
 * been cut with trump; void of the led suit, you must trump if you hold any; and
 * over-trumping is compulsory when you are able to.
 */
export function isLegalMove(
    playedCards: PlayedCard[],
    cardToPlay: Card,
    trumpSuite: Suite | null,
    hand: Card[],
) {
    // Leading: anything goes.
    if (playedCards.length === 0) return true;

    const leadingSuite = playedCards[0].card.suite;
    const holdsLeadingSuite = hasSuite(hand, leadingSuite);

    let strongest = playedCards[0].card;
    let strongestTrump: Card | null = null;
    let trumpPlayed = false;
    let trumpCut = false;

    for (const { card } of playedCards) {
        if (isStrongerThan(card, strongest, trumpSuite)) strongest = card;

        if (isTrump(card, trumpSuite)) {
            trumpPlayed = true;
            // A cut only if trump was not the suit led in the first place.
            trumpCut = leadingSuite !== trumpSuite;

            if (
                strongestTrump === null ||
                isStrongerThan(card, strongestTrump, trumpSuite)
            ) {
                strongestTrump = card;
            }
        }
    }

    if (holdsLeadingSuite) {
        if (cardToPlay.suite !== leadingSuite) return false;

        // Once someone has cut, the trick is out of reach and following suit is
        // the whole obligation — no need to beat anything.
        return (
            trumpCut ||
            !hasStrongerInSuite(hand, strongest, leadingSuite, trumpSuite) ||
            isStrongerThan(cardToPlay, strongest, trumpSuite)
        );
    }

    // Void of the led suit: trump if you hold any.
    if (
        trumpSuite &&
        hasSuite(hand, trumpSuite) &&
        !isTrump(cardToPlay, trumpSuite)
    ) {
        return false;
    }

    // And over-trump if you can.
    if (
        trumpPlayed &&
        strongestTrump &&
        hasStrongerInSuite(
            hand,
            strongestTrump,
            strongestTrump.suite,
            trumpSuite,
        ) &&
        !isStrongerThan(cardToPlay, strongestTrump, trumpSuite)
    ) {
        return false;
    }

    return true;
}

/** The keys of every card in hand that may be thrown right now. */
export function legalMoveKeys(
    playedCards: PlayedCard[],
    trumpSuite: Suite | null,
    hand: Card[],
) {
    return new Set(
        hand
            .filter((card) => isLegalMove(playedCards, card, trumpSuite, hand))
            .map(cardKey),
    );
}

/** Suits in the deck's own order, reversed below for the requested hand layout. */
const SUITE_ORDER = [Suite.HEARTS, Suite.BELLS, Suite.ACORN, Suite.LEAF];

/**
 * The order zvanja run in, mirroring `DeclarationResolver.DECLARATION_RANK_ORDER`
 * on the backend — ace down to seven, with the ten *below* the jack.
 *
 * Note this is neither of the two strength orders: a sequence counts as
 * consecutive by this list, which is why the ten sits where it does.
 */
const DECLARATION_RANK_ORDER = [
    Rank.ACE,
    Rank.KING,
    Rank.QUEEN,
    Rank.JACK,
    Rank.TEN,
    Rank.NINE,
    Rank.EIGHT,
    Rank.SEVEN,
];

/**
 * A hand in a readable order: the reverse of the deck's declaration layout.
 * Cards run seven up to ace, suits run leaf back to hearts, and trump finishes
 * the hand rather than starting it.
 *
 * This is declaration order reversed rather than playing strength, and
 * deliberately. Strength order is what wins tricks, but it splits a terca or a
 * kvarta across the hand — in trump it pulls the jack and nine away from the
 * sequence. Reversing the resolver's whole run keeps every declaration visually
 * consecutive while putting the low end first.
 *
 * The consequence is that the rightmost trump is not necessarily the strongest.
 * That is the trade, and it is the right way round: `legalMoveKeys` already
 * shows which cards can be played, so strength does not need to be read off the
 * ordering, whereas nothing else on screen reveals a zvanje.
 */
export function sortHand(hand: Card[], trumpSuite: Suite | null): Card[] {
    return [...hand].sort((a, b) => {
        const aTrump = isTrump(a, trumpSuite);
        const bTrump = isTrump(b, trumpSuite);

        if (aTrump !== bTrump) return aTrump ? 1 : -1;

        if (a.suite !== b.suite) {
            return SUITE_ORDER.indexOf(b.suite) - SUITE_ORDER.indexOf(a.suite);
        }

        return (
            DECLARATION_RANK_ORDER.indexOf(b.rank) -
            DECLARATION_RANK_ORDER.indexOf(a.rank)
        );
    });
}
