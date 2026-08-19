package pro.damjan.belabackend.user.auth.dto.response;

import lombok.Builder;
import lombok.Getter;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.auth.AuthProvider;

import java.time.Instant;

@Getter
@Builder
public class UserResponse {
    private String id;
    private String username;
    private String email;
    private String avatarUrl;
    private String role;
    private Instant createdAt;
    private Instant lastLoginAt;
    private String authProvider;

    public static UserResponse fromUser(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .authProvider(user.getAuthProvider().name())
                .build();
    }
}
