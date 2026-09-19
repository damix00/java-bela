package pro.damjan.belabackend.admin;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import pro.damjan.belabackend.admin.account.AdminAccountService;
import pro.damjan.belabackend.admin.dto.response.AdminAccountActionsResponse;
import pro.damjan.belabackend.admin.dto.response.AdminAccountDetailResponse;
import pro.damjan.belabackend.admin.dto.response.AdminAccountPageResponse;
import pro.damjan.belabackend.admin.dto.response.AdminAccountPresenceResponse;
import pro.damjan.belabackend.admin.dto.response.AdminAccountSessionResponse;
import pro.damjan.belabackend.security.jwt.JwtService;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.UserRepository;
import pro.damjan.belabackend.user.auth.AuthProvider;
import pro.damjan.belabackend.user.auth.Role;
import pro.damjan.belabackend.user.presence.PresenceStatus;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "app.internal-api-key=test-internal-api-key"
)
class AdminAccountSecurityTest {
    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @MockitoBean
    private AdminAccountService accountService;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        reset(accountService);
    }

    @Test
    void accountEndpointsRejectMissingAndNonAdminCredentials() throws Exception {
        assertThat(get("/admin/accounts", null).statusCode()).isEqualTo(401);

        User regular = saveUser("Regular", Role.USER);
        assertThat(get("/admin/accounts", jwtService.generateAccessToken(regular.getId())).statusCode())
                .isEqualTo(403);
        verifyNoInteractions(accountService);
    }

    @Test
    void listPayloadDoesNotExposeSessionMetadataButDetailDoes() throws Exception {
        User admin = saveUser("Admin", Role.ADMIN);
        when(accountService.list(any(), anyString(), anyString(), anyString(), any()))
                .thenReturn(new AdminAccountPageResponse(List.of(), null));
        when(accountService.detail(any(User.class), anyString())).thenReturn(detail());
        String token = jwtService.generateAccessToken(admin.getId());

        HttpResponse<String> list = get("/admin/accounts", token);
        HttpResponse<String> detail = get("/admin/accounts/user-1", token);

        assertThat(list.statusCode()).isEqualTo(200);
        assertThat(list.body()).doesNotContain("ipAddress").doesNotContain("userAgent");
        assertThat(detail.statusCode()).isEqualTo(200);
        assertThat(detail.body()).contains("203.0.113.7").contains("Test Browser");
    }

    private HttpResponse<String> get(String path, String token) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + path))
                .GET();
        if (token != null) {
            request.header("Authorization", "Bearer " + token);
        }
        return httpClient.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private User saveUser(String username, Role role) {
        User user = new User();
        user.setUsername(username);
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setRole(role);
        return userRepository.saveAndFlush(user);
    }

    private static AdminAccountDetailResponse detail() {
        Instant now = Instant.parse("2026-09-17T12:00:00Z");
        return new AdminAccountDetailResponse(
                "user-1", "Player", "player@example.com", null, null, null,
                AuthProvider.LOCAL, Role.USER, now, now, now,
                new AdminAccountPresenceResponse(PresenceStatus.ONLINE, now, null, null),
                List.of(new AdminAccountSessionResponse(
                        "session-1", true, now, "203.0.113.7", "Test Browser")),
                new AdminAccountActionsResponse(true, true, true, null, null)
        );
    }
}
