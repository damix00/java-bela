/**
 * Wire protocol shared between the Spring Boot API and the web client.
 *
 * `generated.ts` is produced from the Java DTOs by `npm run protocol` and must
 * never be edited by hand. This file is the hand-maintained half: it holds the
 * event-name <-> payload mapping, which reflection cannot see because names
 * live inside constructor calls (`super("game:cardThrown")`) and `@OnEvent`
 * annotations.
 *
 * When you add or rename an event on the backend, update the matching map here.
 */

export * from "./generated";

import type {
    CardThrownEvent,
    CardTurnStartedEvent,
    ChangeLobbyConfigCommand,
    ChooseTrumpCommand,
    GameEndedEvent,
    GameSnapshotEvent,
    GameStatusChangedEvent,
    JoinLobbyViaCodeCommand,
    LobbyConfigurationChangedEvent,
    LobbyGameCreatedEvent,
    LobbyHostChangedEvent,
    LobbyInitialStateEvent,
    LobbyMatchmakingStatusEvent,
    LobbyPlayerJoinedEvent,
    LobbyPlayerLeftEvent,
    LobbyPlayerStatusChangeEvent,
    LobbyReadyCommand,
    LobbySeatsUpdatedEvent,
    RoundStartEvent,
    SwapSeatsCommand,
    ThrowCardCommand,
    TrumpChoiceSkippedEvent,
    TrumpChoosingStartedEvent,
    TrumpChosenEvent,
} from "./generated";

/** Server -> client. Keys match `OutgoingEvent`'s `eventName`. */
export interface ServerEvents {
    "game:cardThrown": CardThrownEvent;
    "game:cardTurnStarted": CardTurnStartedEvent;
    "game:ended": GameEndedEvent;
    "game:roundStart": RoundStartEvent;
    "game:snapshot": GameSnapshotEvent;
    "game:statusChanged": GameStatusChangedEvent;
    "game:trumpChoiceSkipped": TrumpChoiceSkippedEvent;
    "game:trumpChoosingStarted": TrumpChoosingStartedEvent;
    "game:trumpChosen": TrumpChosenEvent;
    "lobby:configChanged": LobbyConfigurationChangedEvent;
    "lobby:gameCreated": LobbyGameCreatedEvent;
    "lobby:hostUpdated": LobbyHostChangedEvent;
    "lobby:initialState": LobbyInitialStateEvent;
    "lobby:matchmakingStatus": LobbyMatchmakingStatusEvent;
    "lobby:playerJoined": LobbyPlayerJoinedEvent;
    "lobby:playerLeft": LobbyPlayerLeftEvent;
    "lobby:playerStatusChange": LobbyPlayerStatusChangeEvent;
    "lobby:seatsUpdated": LobbySeatsUpdatedEvent;
}

/**
 * Client -> server. Keys match the backend's `@OnEvent` annotations.
 * `null` means the event carries no payload.
 */
export interface ClientEvents {
    "game:card:throw": ThrowCardCommand;
    "game:declarations:decline": null;
    "game:leave": null;
    "game:loaded": null;
    "game:trump:choose": ChooseTrumpCommand;
    "game:trump:pass": null;
    "lobby:changeConfig": ChangeLobbyConfigCommand;
    "lobby:create": null;
    "lobby:join:code": JoinLobbyViaCodeCommand;
    "lobby:leave": null;
    "lobby:ready": LobbyReadyCommand;
    "lobby:swapSeats": SwapSeatsCommand;
    "session:keepAlive": null;
}

export type ServerEventName = keyof ServerEvents;
export type ClientEventName = keyof ClientEvents;

/**
 * A decoded server frame, discriminated on `event`.
 * Envelope matches WebSocketPublisher: `{"event": name, "data": payload}`.
 */
export type ServerMessage = {
    [K in ServerEventName]: { event: K; data: ServerEvents[K] };
}[ServerEventName];

/**
 * A client frame, discriminated on `event`.
 *
 * Note the payload key is `body`, not `data` -- the incoming and outgoing
 * envelopes are deliberately asymmetric on the backend
 * (see IncomingWebSocketMessage vs WebSocketPublisher). Payload-less events
 * omit the key entirely.
 */
export type ClientMessage = {
    [K in ClientEventName]: ClientEvents[K] extends null
        ? { event: K; body?: undefined }
        : { event: K; body: ClientEvents[K] };
}[ClientEventName];
