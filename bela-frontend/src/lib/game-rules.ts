import { Card, getCardKey, Rank, Suite, Trick } from "@/types/game";

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

const TRUMP_POINTS: Record<Rank, number> = {
  ...NORMAL_POINTS,
  [Rank.NINE]: 14,
  [Rank.JACK]: 20,
};

export function isTrump(card: Card, trumpSuite: Suite | null) {
  return trumpSuite ? card.suite === trumpSuite : card.trump;
}

// Bela (+20) is the trump King + Queen pair, declared on play. Only worth prompting
// for when the player can actually complete the pair: the partner trump card is still
// in hand or was already played by this player earlier in the round.
export function canDeclareBela(
  card: Card,
  trumpSuite: Suite | null,
  hand: Card[],
  myPlayedCards: Card[],
) {
  if (!isTrump(card, trumpSuite)) {
    return false;
  }

  if (card.rank !== Rank.KING && card.rank !== Rank.QUEEN) {
    return false;
  }

  const partnerRank = card.rank === Rank.KING ? Rank.QUEEN : Rank.KING;
  const matchesPartner = (candidate: Card) =>
    candidate.suite === card.suite && candidate.rank === partnerRank;

  return hand.some(matchesPartner) || myPlayedCards.some(matchesPartner);
}

function getPoints(card: Card, trumpSuite: Suite | null) {
  return isTrump(card, trumpSuite)
    ? TRUMP_POINTS[card.rank]
    : NORMAL_POINTS[card.rank];
}

function isStrongerThan(
  card: Card,
  previousCard: Card,
  trumpSuite: Suite | null,
) {
  const cardIsTrump = isTrump(card, trumpSuite);
  const previousCardIsTrump = isTrump(previousCard, trumpSuite);

  if (cardIsTrump && !previousCardIsTrump) {
    return true;
  }

  if (!cardIsTrump && previousCardIsTrump) {
    return false;
  }

  if (card.suite === previousCard.suite) {
    return getPoints(card, trumpSuite) > getPoints(previousCard, trumpSuite);
  }

  return false;
}

function hasSuiteCard(hand: Card[], suite: Suite) {
  return hand.some((card) => card.suite === suite);
}

function hasStrongerCardInSuite(
  hand: Card[],
  card: Card,
  suite: Suite,
  trumpSuite: Suite | null,
) {
  return hand.some(
    (playerCard) =>
      playerCard.suite === suite && isStrongerThan(playerCard, card, trumpSuite),
  );
}

export function isLegalMove(
  currentTrick: Trick | null | undefined,
  cardToPlay: Card,
  trumpSuite: Suite | null,
  hand: Card[],
) {
  if (!currentTrick || currentTrick.complete) {
    return false;
  }

  const playedCards = currentTrick.playedCards;

  if (playedCards.length === 0) {
    return true;
  }

  const firstCard = playedCards[0].card;
  const leadingSuite = firstCard.suite;
  const hasLeadingSuite = hasSuiteCard(hand, leadingSuite);
  let trumpPlayed = false;
  let trumpCutPlayed = false;
  let strongestCard = firstCard;
  let strongestTrump: Card | null = null;

  for (const playedCard of playedCards) {
    const played = playedCard.card;

    if (isStrongerThan(played, strongestCard, trumpSuite)) {
      strongestCard = played;
    }
  }

  for (const playedCard of playedCards) {
    const played = playedCard.card;

    if (isTrump(played, trumpSuite)) {
      trumpPlayed = true;
      trumpCutPlayed = leadingSuite !== trumpSuite;

      if (
        strongestTrump === null ||
        isStrongerThan(played, strongestTrump, trumpSuite)
      ) {
        strongestTrump = played;
      }
    }
  }

  if (hasLeadingSuite) {
    if (cardToPlay.suite !== leadingSuite) {
      return false;
    }

    return (
      trumpCutPlayed ||
      !hasStrongerCardInSuite(hand, strongestCard, leadingSuite, trumpSuite) ||
      isStrongerThan(cardToPlay, strongestCard, trumpSuite)
    );
  }

  if (
    trumpSuite &&
    hasSuiteCard(hand, trumpSuite) &&
    !isTrump(cardToPlay, trumpSuite)
  ) {
    return false;
  }

  if (
    trumpPlayed &&
    strongestTrump &&
    hasStrongerCardInSuite(
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

export function getLegalMoveCardKeys(
  currentTrick: Trick | null | undefined,
  trumpSuite: Suite | null,
  hand: Card[],
) {
  return new Set(
    hand
      .filter((card) => isLegalMove(currentTrick, card, trumpSuite, hand))
      .map(getCardKey),
  );
}
