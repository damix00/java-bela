/* tslint:disable */
/* eslint-disable */

export interface AuthResponse {
    accessToken: string;
    expiresIn: number;
    refreshExpiresIn: number;
    refreshToken: string;
    user: UserResponse;
}

export interface BeloteGame {
    config: GameConfiguration;
    currentRound: BeloteRound;
    currentRoundNumber: number;
    id: string;
    maxPoints: number;
    rounds: BeloteRound[];
    status: GameStatus;
    team1: Team;
    team2: Team;
    winningTeamIndex: number;
}

export interface BeloteRound {
    choosingTrump: boolean;
    currentTrick: Trick;
    currentTrickNumber: number;
    currentTurnIndex: number;
    lastTrumpChooser: boolean;
    roundNumber: number;
    roundPlayers: RoundPlayer[];
    roundStatus: RoundStatus;
    startingPlayerIndex: number;
    team1: RoundTeam;
    team1RoundScore: number;
    team2: RoundTeam;
    team2RoundScore: number;
    tricks: Trick[];
    trumpCallerIndex: number;
    trumpSuite: Suite;
}

export interface Candidate {
    declaration: Declaration;
    playerIndex: number;
    teamIndex: number;
}

export interface Card {
    hidden: boolean;
    points: number;
    rank: Rank;
    strength: number;
    suite: Suite;
    trump: boolean;
}

export interface CardThrowResult {
    bela: boolean;
    legalMove: boolean;
    nextTrickPending: boolean;
    trickComplete: boolean;
    trickNumber: number;
    winningPlayerIndex: number;
}

export interface CardThrownEvent extends OutgoingEvent {
    bela: boolean;
    card: Card;
    expired: boolean;
    nextTrickPending: boolean;
    nextTurnIndex: number;
    pendingDelaySeconds: number;
    playerIndex: number;
    roundNumber: number;
    team1CardPoints: number;
    team1RoundPoints: number;
    team1TotalScore: number;
    team2CardPoints: number;
    team2RoundPoints: number;
    team2TotalScore: number;
    timeoutSeconds: number;
    trickComplete: boolean;
    trickNumber: number;
    winningPlayerIndex: number;
}

export interface CardTurnStartedEvent extends OutgoingEvent {
    currentTurnIndex: number;
    roundNumber: number;
    timeoutSeconds: number;
    trickNumber: number;
}

export interface ChangeLobbyConfigCommand extends IncomingEvent {
    matchType: string;
    points: number;
}

export interface ChooseTrumpCommand extends IncomingEvent {
    suite: Suite;
}

export interface Deck {
}

export interface Declaration {
    cards: Card[];
    playerIndex: number;
    points: number;
    type: Type;
}

export interface DeclarationsRevealedEvent extends OutgoingEvent {
    declinedDeclarationSeats: number[];
    roundNumber: number;
    roundStatus: RoundStatus;
    team1Declarations: Declaration[];
    team2Declarations: Declaration[];
    timeoutSeconds: number;
}

export interface GameConfiguration {
    matchType: MatchType;
    targetScore: number;
}

export interface GameEndedEvent extends OutgoingEvent {
    gameStatus: GameStatus;
    team1FinalScore: number;
    team2FinalScore: number;
    winningTeamIndex: number;
}

export interface GamePlayer {
    avatarUrl: string;
    bot: boolean;
    hand: Card[];
    seatIndex: number;
    teamIndex: number;
    userId: string;
    username: string;
}

export interface GameSnapshotEvent extends PerspectiveOutgoingEvent {
    currentRound: RoundSnapshot;
    gameId: string;
    maxPoints: number;
    status: GameStatus;
    team1: TeamSnapshot;
    team2: TeamSnapshot;
}

export interface GameStatusChangedEvent extends OutgoingEvent {
    gameStatus: GameStatus;
}

export interface IncomingEvent {
}

export interface JoinLobbyViaCodeCommand extends IncomingEvent {
    inviteCode: string;
}

export interface Lobby {
    gameConfiguration: GameConfiguration;
    gameId: string;
    id: string;
    inviteCode: string;
    joinable: boolean;
    playerSeats: { [index: string]: LobbyPlayer };
    status: LobbyStatus;
}

export interface LobbyConfigurationChangedEvent extends OutgoingEvent {
    configuration: GameConfiguration;
}

export interface LobbyGameCreatedEvent extends OutgoingEvent {
    game: BeloteGame;
    lobby: Lobby;
}

export interface LobbyHostChangedEvent extends OutgoingEvent {
    newHostId: string;
}

export interface LobbyInitialStateEvent extends OutgoingEvent {
    lobby: Lobby;
}

export interface LobbyMatchmakingStatusEvent extends OutgoingEvent {
    status: LobbyStatus;
}

export interface LobbyPlayer {
    avatarUrl: string;
    bot: boolean;
    host: boolean;
    seat: number;
    status: LobbyPlayerStatus;
    userId: string;
    username: string;
}

export interface LobbyPlayerJoinedEvent extends OutgoingEvent {
    player: LobbyPlayer;
}

export interface LobbyPlayerLeftEvent extends OutgoingEvent {
    userId: string;
}

export interface LobbyPlayerStatusChangeEvent extends OutgoingEvent {
    status: LobbyPlayerStatus;
    userId: string;
}

export interface LobbyReadyCommand extends IncomingEvent {
    ready: boolean;
}

export interface LobbySeatsUpdatedEvent extends OutgoingEvent {
    userSeats: { [index: string]: LobbyPlayer };
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LogoutRequest {
    refreshToken: string;
}

export interface OutgoingEvent {
}

export interface PerspectiveOutgoingEvent extends OutgoingEvent {
    perspectiveUserId: string;
}

export interface PlayedCard {
    card: Card;
    playerIndex: number;
}

export interface PlayerDeclarations {
    declarations: Declaration[];
    playerIndex: number;
    teamIndex: number;
}

export interface PlayerSnapshot {
    avatarUrl: string;
    bot: boolean;
    cardCount: number;
    hand: Card[];
    seatIndex: number;
    userId: string;
    username: string;
}

export interface PublicUserResponse {
    avatarUrl: string;
    bio: string;
    countryCode: string;
    createdAt: Date;
    id: string;
    username: string;
}

export interface RefreshRequest {
    refreshToken: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    username: string;
}

export interface Result {
    belot: boolean;
    team1Declarations: Declaration[];
    team2Declarations: Declaration[];
    winningTeamIndex: number;
}

export interface RoundPlayer {
    belaDeclared: boolean;
    choosesToDeclare: boolean;
    declarationAnswered: boolean;
    declarations: Declaration[];
    playerIndex: number;
}

export interface RoundSnapshot {
    answeredDeclarationSeats: number[];
    currentTrickCards: PlayedCard[];
    currentTrickNumber: number;
    currentTrickWinningPlayerIndex: number;
    currentTurnIndex: number;
    declinedDeclarationSeats: number[];
    myDeclarations: Declaration[];
    roundNumber: number;
    roundStatus: RoundStatus;
    team1CardPoints: number;
    team1Declarations: Declaration[];
    team1RoundPoints: number;
    team2CardPoints: number;
    team2Declarations: Declaration[];
    team2RoundPoints: number;
    timeoutSeconds: number;
    timerType: string;
    trumpCallerIndex: number;
    trumpSuite: Suite;
}

export interface RoundStartEvent extends OutgoingEvent {
    currentTurnIndex: number;
    hand: Card[];
    roundNumber: number;
    roundStatus: RoundStatus;
    team1RoundPoints: number;
    team2RoundPoints: number;
}

export interface RoundTeam {
    calledTrump: boolean;
    cardPoints: number;
    points: number;
}

export interface SessionSupersededEvent extends OutgoingEvent {
}

export interface SwapSeatsCommand extends IncomingEvent {
    seat: number;
}

export interface Team {
    players: GamePlayer[];
    totalScore: number;
}

export interface TeamPair {
    teamA: Team;
    teamB: Team;
}

export interface TeamSnapshot {
    players: PlayerSnapshot[];
    totalScore: number;
}

export interface ThrowCardCommand extends IncomingEvent {
    declareBela: boolean;
    rank: Rank;
    suite: Suite;
}

export interface Trick {
    complete: boolean;
    playedCards: PlayedCard[];
    trickNumber: number;
    winningPlayerIndex: number;
}

export interface TrumpChoiceSkippedEvent extends PerspectiveOutgoingEvent {
    nextTurnIndex: number;
    revealedCards: Card[];
    roundNumber: number;
    skippedTurnIndex: number;
    timeoutSeconds: number;
}

export interface TrumpChoosingStartedEvent extends OutgoingEvent {
    currentTurnIndex: number;
    roundNumber: number;
    timeoutSeconds: number;
}

export interface TrumpChosenEvent extends PerspectiveOutgoingEvent {
    chosenByTurnIndex: number;
    currentTurnIndex: number;
    hand: Card[];
    myDeclarations: Declaration[];
    revealedCards: Card[];
    roundNumber: number;
    roundStatus: RoundStatus;
    team1CardPoints: number;
    team1Declarations: Declaration[];
    team1RoundPoints: number;
    team1TotalScore: number;
    team2CardPoints: number;
    team2Declarations: Declaration[];
    team2RoundPoints: number;
    team2TotalScore: number;
    timeoutSeconds: number;
    trumpSuite: Suite;
}

export interface UpdateProfileRequest {
    bio: string;
    countryCode: string;
    username: string;
}

export interface UserResponse {
    authProvider: string;
    avatarUrl: string;
    bio: string;
    countryCode: string;
    createdAt: Date;
    email: string;
    id: string;
    lastLoginAt: Date;
    role: string;
    username: string;
}

export enum GameStatus {
    WAITING = "WAITING",
    IN_PROGRESS = "IN_PROGRESS",
    FINISHED = "FINISHED",
}

export enum LobbyPlayerStatus {
    NOT_READY = "NOT_READY",
    READY = "READY",
}

export enum LobbyStatus {
    IN_LOBBY = "IN_LOBBY",
    MATCHMAKING = "MATCHMAKING",
    IN_GAME = "IN_GAME",
}

export enum MatchType {
    RANKED = "RANKED",
    CASUAL = "CASUAL",
    PRIVATE = "PRIVATE",
}

export enum PresenceStatus {
    ONLINE = "ONLINE",
    IN_LOBBY = "IN_LOBBY",
    IN_GAME = "IN_GAME",
    AWAY = "AWAY",
    OFFLINE = "OFFLINE",
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

export enum RefreshError {
    INVALID = "INVALID",
    EXPIRED = "EXPIRED",
    REUSE_DETECTED = "REUSE_DETECTED",
    USER_GONE = "USER_GONE",
}

export enum RemoveResult {
    NOT_FOUND = "NOT_FOUND",
    REMOVED = "REMOVED",
    REMOVED_AND_HOST_CHANGED = "REMOVED_AND_HOST_CHANGED",
}

export enum Role {
    USER = "USER",
    ADMIN = "ADMIN",
}

export enum RoundStatus {
    CHOOSING_TRUMP = "CHOOSING_TRUMP",
    DECLARING = "DECLARING",
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

export enum TokenError {
    MISSING = "MISSING",
    MALFORMED = "MALFORMED",
    BAD_SIGNATURE = "BAD_SIGNATURE",
    EXPIRED = "EXPIRED",
    WRONG_TYPE = "WRONG_TYPE",
}

export enum Type {
    BELOTE = "BELOTE",
    BELA = "BELA",
    SEQUENCE_3 = "SEQUENCE_3",
    SEQUENCE_4 = "SEQUENCE_4",
    SEQUENCE_5 = "SEQUENCE_5",
    FOUR_JACKS = "FOUR_JACKS",
    FOUR_NINES = "FOUR_NINES",
    FOUR_OF_A_KIND = "FOUR_OF_A_KIND",
}
