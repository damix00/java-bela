export enum LobbyPlayerStatus {
  NotReady = "NOT_READY",
  Ready = "READY",
}

export enum LobbyStatus {
  InLobby = "IN_LOBBY",
  InGame = "IN_GAME",
}

export type LobbyPlayer = {
  userId: string;
  host: boolean;
  seat: number;
  status: LobbyPlayerStatus;
  bot: boolean;
} | null;

export type Lobby = {
  id: string;
  gameId: string | null;
  inviteCode: string;
  status: LobbyStatus;
  playerSeats: { [key: number]: LobbyPlayer };
};
