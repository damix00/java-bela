// Game types matching the Java backend models

export enum GameStatus {
    WAITING = "WAITING",
    IN_PROGRESS = "IN_PROGRESS",
    FINISHED = "FINISHED",
}

export enum RoundStatus {
    CHOOSING_TRUMP = "CHOOSING_TRUMP",
    DECLARATIONS = "DECLARATIONS",
    PLAYING = "PLAYING",
    FINISHED = "FINISHED",
}

export enum Suite {
    HEARTS = "HEARTS",
    BELLS = "BELLS",
    ACORN = "ACORN",
    LEAF = "LEAF",
}

export enum Rank {
    SEVEN = "SEVEN",
    EIGHT = "EIGHT",
    NINE = "NINE",
    TEN = "TEN",
    JACK = "JACK",
    QUEEN = "QUEEN",
    KING = "KING",
    ACE = "ACE",
}

export type Card = {
    suite: Suite;
    rank: Rank;
    trump: boolean;
    hidden: boolean;
};

export type PlayedCard = {
    playerIndex: number;
    card: Card;
};

export type Trick = {
    trickNumber: number;
    playedCards: PlayedCard[];
    winningPlayerIndex: number;
    complete: boolean;
};

export type RoundTeam = {
    cardPoints: number;
    declarations: Declaration[];
    calledTrump: boolean;
};

export enum DeclarationType {
    BELOTE = "BELOTE",
    BELA = "BELA",
    SEQUENCE_3 = "SEQUENCE_3",
    SEQUENCE_4 = "SEQUENCE_4",
    SEQUENCE_5 = "SEQUENCE_5",
    FOUR_JACKS = "FOUR_JACKS",
    FOUR_NINES = "FOUR_NINES",
    FOUR_OF_A_KIND = "FOUR_OF_A_KIND",
}

export type Declaration = {
    type: DeclarationType;
    points: number;
};

export type BeloteRound = {
    roundNumber: number;
    roundStatus: RoundStatus;
    trumpSuite: Suite | null;
    currentTurnIndex: number;
    currentTrickNumber: number;
    tricks: Trick[];
    currentTrick: Trick | null;
};

export type GamePlayer = {
    userId: string;
    seatIndex: number;
    hand: Card[];
    teamIndex: number;
    bot: boolean;
};

export type Team = {
    players: GamePlayer[];
    totalScore: number;
};

export type BeloteGame = {
    id: string;
    team1: Team;
    team2: Team;
    maxPoints: number;
    status: GameStatus;
    currentRoundNumber: number;
    rounds: BeloteRound[];
    currentRound: BeloteRound | null;
};

// Helper: get all 4 players in seat order (matching backend getPlayers())
// Backend: team1[0], team2[0], team1[1], team2[1] → seats 0,1,2,3
export function getPlayersInSeatOrder(game: BeloteGame): GamePlayer[] {
    return [
        game.team1.players[0],
        game.team2.players[0],
        game.team1.players[1],
        game.team2.players[1],
    ];
}

// Suite display helpers
export const SUITE_SYMBOLS: Record<Suite, string> = {
    [Suite.HEARTS]: "\u2665",
    [Suite.BELLS]: "\u2666",
    [Suite.ACORN]: "\u2663",
    [Suite.LEAF]: "\u2660",
};

export const SUITE_COLORS: Record<Suite, string> = {
    [Suite.HEARTS]: "text-red-500",
    [Suite.BELLS]: "text-red-500",
    [Suite.ACORN]: "text-white",
    [Suite.LEAF]: "text-white",
};

export const SUITE_NAMES: Record<Suite, string> = {
    [Suite.HEARTS]: "Hearts",
    [Suite.BELLS]: "Diamonds",
    [Suite.ACORN]: "Clubs",
    [Suite.LEAF]: "Spades",
};

export const RANK_LABELS: Record<Rank, string> = {
    [Rank.SEVEN]: "7",
    [Rank.EIGHT]: "8",
    [Rank.NINE]: "9",
    [Rank.TEN]: "10",
    [Rank.JACK]: "J",
    [Rank.QUEEN]: "Q",
    [Rank.KING]: "K",
    [Rank.ACE]: "A",
};
