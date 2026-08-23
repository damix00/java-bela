package pro.damjan.belabackend.user.username;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.user.UserRepository;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GuestUsernameAllocatorTest {

    private GuestUsernameGenerator guestUsernameGenerator;
    private UserRepository userRepository;
    private GuestUsernameAllocator guestUsernameAllocator;

    /** Suffix length requested for each generate() call, in order. */
    private List<Integer> requestedSuffixDigits;

    @BeforeEach
    void setUp() {
        guestUsernameGenerator = mock(GuestUsernameGenerator.class);
        userRepository = mock(UserRepository.class);
        guestUsernameAllocator = new GuestUsernameAllocator(guestUsernameGenerator, userRepository);

        requestedSuffixDigits = new ArrayList<>();
        when(guestUsernameGenerator.generate(anyInt())).thenAnswer(invocation -> {
            int digits = invocation.getArgument(0);
            requestedSuffixDigits.add(digits);
            return "SwiftFalcon" + "1".repeat(digits) + "#" + requestedSuffixDigits.size();
        });
    }

    @Test
    void returnsTheFirstCandidateWhenItIsFree() {
        when(userRepository.existsByUsername(anyString())).thenReturn(false);

        String allocated = guestUsernameAllocator.allocate();

        assertThat(allocated).isEqualTo("SwiftFalcon11#1");
        assertThat(requestedSuffixDigits).containsExactly(2);
        verify(guestUsernameGenerator, never()).generateWithHexSuffix();
    }

    @Test
    void skipsTakenCandidatesAndKeepsTheFirstFreeOne() {
        when(userRepository.existsByUsername(anyString())).thenReturn(true, true, false);

        String allocated = guestUsernameAllocator.allocate();

        assertThat(allocated).isEqualTo("SwiftFalcon11#3");
        assertThat(requestedSuffixDigits).containsExactly(2, 2, 2);
    }

    @Test
    void widensTheSuffixWhenTheTwoDigitRungIsExhausted() {
        // Five two-digit candidates taken, then a four-digit one is free.
        when(userRepository.existsByUsername(anyString()))
                .thenReturn(true, true, true, true, true, false);

        String allocated = guestUsernameAllocator.allocate();

        assertThat(allocated).isEqualTo("SwiftFalcon1111#6");
        assertThat(requestedSuffixDigits).containsExactly(2, 2, 2, 2, 2, 4);
    }

    @Test
    void widensToEightDigitsWhenTheFourDigitRungIsExhausted() {
        when(userRepository.existsByUsername(anyString()))
                .thenReturn(true, true, true, true, true, true, true, true, false);

        String allocated = guestUsernameAllocator.allocate();

        assertThat(allocated).isEqualTo("SwiftFalcon11111111#9");
        assertThat(requestedSuffixDigits).containsExactly(2, 2, 2, 2, 2, 4, 4, 4, 8);
    }

    @Test
    void fallsBackToTheHexSuffixWithoutLoopingForever() {
        when(userRepository.existsByUsername(anyString())).thenReturn(true);
        when(guestUsernameGenerator.generateWithHexSuffix()).thenReturn("SwiftFalcon3f2a91b4");

        String allocated = guestUsernameAllocator.allocate();

        assertThat(allocated).isEqualTo("SwiftFalcon3f2a91b4");
        assertThat(requestedSuffixDigits).containsExactly(2, 2, 2, 2, 2, 4, 4, 4, 8, 8);
    }
}
