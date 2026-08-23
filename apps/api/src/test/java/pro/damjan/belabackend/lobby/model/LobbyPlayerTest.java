package pro.damjan.belabackend.lobby.model;

import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

class LobbyPlayerTest {

    @Test
    void namesEverySeatAtATableDistinctly() {
        Set<String> names = IntStream.range(0, Lobby.MAX_PLAYERS)
                .mapToObj(LobbyPlayer::botNameForSeat)
                .collect(Collectors.toSet());

        assertThat(names).hasSize(Lobby.MAX_PLAYERS);
    }

    @Test
    void wrapsBotNamesPastTheLastSeat() {
        assertThat(LobbyPlayer.botNameForSeat(4)).isEqualTo(LobbyPlayer.botNameForSeat(0));
        assertThat(LobbyPlayer.botNameForSeat(-1)).isEqualTo(LobbyPlayer.botNameForSeat(3));
    }

    @Test
    void createsBotsReadyAndFlaggedWithASyntheticId() {
        LobbyPlayer bot = LobbyPlayer.createBot();

        assertThat(bot.isBot()).isTrue();
        assertThat(bot.isHost()).isFalse();
        assertThat(bot.getStatus()).isEqualTo(LobbyPlayerStatus.READY);
        // The frontend has no users row to resolve, so the prefix is the contract.
        assertThat(bot.getUserId()).startsWith("bot-");
    }

    @Test
    void createsBotsWithDistinctIds() {
        assertThat(LobbyPlayer.createBot().getUserId())
                .isNotEqualTo(LobbyPlayer.createBot().getUserId());
    }
}
