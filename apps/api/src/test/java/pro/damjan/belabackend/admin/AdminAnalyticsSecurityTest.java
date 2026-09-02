package pro.damjan.belabackend.admin;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import pro.damjan.belabackend.admin.dto.response.AdminAnalyticsResponse;
import pro.damjan.belabackend.admin.dto.response.LiveActivityAnalyticsResponse;
import pro.damjan.belabackend.admin.dto.response.UserAnalyticsResponse;
import pro.damjan.belabackend.security.jwt.JwtConfig;
import pro.damjan.belabackend.security.jwt.JwtService;
import pro.damjan.belabackend.security.ratelimit.InternalSourceService;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.UserRepository;
import pro.damjan.belabackend.user.auth.AuthProvider;
import pro.damjan.belabackend.user.auth.Role;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "app.internal-api-key=test-internal-api-key"
)
class AdminAnalyticsSecurityTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JwtConfig jwtConfig;

    @MockitoBean
    private AdminAnalyticsService analyticsService;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        reset(analyticsService);
        when(analyticsService.snapshot()).thenReturn(snapshot());
    }

    @Test
    void rejectsAMissingTokenWithoutReadingAnalytics() throws Exception {
        HttpResponse<String> response = get(null, null);

        assertRejected(response, 401);
    }

    @Test
    void rejectsAMalformedTokenWithoutReadingAnalytics() throws Exception {
        HttpResponse<String> response = get("not-a-jwt", null);

        assertRejected(response, 401);
    }

    @Test
    void rejectsAnExpiredTokenWithoutReadingAnalytics() throws Exception {
        User user = saveUser("ExpiredAdmin", AuthProvider.LOCAL, Role.ADMIN);
        JwtConfig expiredConfig = new JwtConfig();
        expiredConfig.setSecret(jwtConfig.getSecret());
        expiredConfig.setAccessExpirationMs(-1_000);
        String expiredToken = new JwtService(expiredConfig).generateAccessToken(user.getId());

        HttpResponse<String> response = get(expiredToken, null);

        assertRejected(response, 401);
    }

    @Test
    void rejectsATokenForADeletedUserWithoutReadingAnalytics() throws Exception {
        User user = saveUser("DeletedAdmin", AuthProvider.LOCAL, Role.ADMIN);
        String token = jwtService.generateAccessToken(user.getId());
        userRepository.deleteById(user.getId());
        userRepository.flush();

        HttpResponse<String> response = get(token, null);

        assertRejected(response, 401);
    }

    @Test
    void rejectsAGuestWithoutReadingAnalytics() throws Exception {
        User guest = saveUser("GuestUser", AuthProvider.ANONYMOUS, Role.USER);

        HttpResponse<String> response = get(jwtService.generateAccessToken(guest.getId()), null);

        assertRejected(response, 403);
    }

    @Test
    void rejectsARegularUserWithoutReadingAnalytics() throws Exception {
        User regularUser = saveUser("RegularUser", AuthProvider.LOCAL, Role.USER);
        String token = jwtService.generateAccessToken(regularUser.getId());

        HttpResponse<String> me = get("/auth/me", token, null);
        assertThat(me.statusCode()).withFailMessage(me.body()).isEqualTo(200);

        HttpResponse<String> response = get(token, null);

        assertRejected(response, 403);
    }

    @Test
    void internalSourceHeaderDoesNotElevateARegularUser() throws Exception {
        User regularUser = saveUser("InternalRegular", AuthProvider.LOCAL, Role.USER);

        HttpResponse<String> response = get(
                jwtService.generateAccessToken(regularUser.getId()),
                "test-internal-api-key"
        );

        assertRejected(response, 403);
    }

    @Test
    void aRoleDowngradeInvalidatesAdminAccessWithoutReissuingTheToken() throws Exception {
        User admin = saveUser("DowngradedAdmin", AuthProvider.LOCAL, Role.ADMIN);
        String token = jwtService.generateAccessToken(admin.getId());
        admin.setRole(Role.USER);
        userRepository.saveAndFlush(admin);

        HttpResponse<String> response = get(token, null);

        assertRejected(response, 403);
    }

    @Test
    void allowsAnAdminAndReturnsOnlyTheAnalyticsPayload() throws Exception {
        User admin = saveUser("ActiveAdmin", AuthProvider.LOCAL, Role.ADMIN);

        HttpResponse<String> response = get(jwtService.generateAccessToken(admin.getId()), null);

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body())
                .contains("\"generatedAt\":\"2026-09-02T12:00:00Z\"")
                .contains("\"total\":12")
                .contains("\"connectedUsers\":2");
        verify(analyticsService).snapshot();
    }

    private HttpResponse<String> get(String token, String internalSourceToken) throws Exception {
        return get("/admin/analytics", token, internalSourceToken);
    }

    private HttpResponse<String> get(String path, String token, String internalSourceToken) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + path))
                .GET();

        if (token != null) {
            request.header("Authorization", "Bearer " + token);
        }
        if (internalSourceToken != null) {
            request.header(InternalSourceService.INTERNAL_SOURCE_HEADER, internalSourceToken);
        }

        return httpClient.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private User saveUser(String username, AuthProvider authProvider, Role role) {
        User user = new User();
        user.setUsername(username);
        user.setAuthProvider(authProvider);
        user.setRole(role);
        return userRepository.saveAndFlush(user);
    }

    private void assertRejected(HttpResponse<String> response, int expectedStatus) {
        assertThat(response.statusCode())
                .withFailMessage("Expected %s, got %s with body %s", expectedStatus, response.statusCode(), response.body())
                .isEqualTo(expectedStatus);
        assertThat(response.body())
                .doesNotContain("generatedAt")
                .doesNotContain("connectedUsers")
                .doesNotContain("registeredLast30Days");
        verifyNoInteractions(analyticsService);
    }

    private static AdminAnalyticsResponse snapshot() {
        return AdminAnalyticsResponse.builder()
                .generatedAt(Instant.parse("2026-09-02T12:00:00Z"))
                .users(UserAnalyticsResponse.builder()
                        .total(12)
                        .registered(8)
                        .guests(4)
                        .admins(1)
                        .registeredLast24Hours(3)
                        .registeredLast7Days(5)
                        .registeredLast30Days(7)
                        .build())
                .activity(LiveActivityAnalyticsResponse.builder()
                        .connectedUsers(2)
                        .sessions(3)
                        .lobbiesTotal(1)
                        .gamesTotal(1)
                        .build())
                .build();
    }
}
