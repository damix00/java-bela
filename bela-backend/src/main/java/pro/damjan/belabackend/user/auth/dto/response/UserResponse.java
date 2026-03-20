package pro.damjan.belabackend.user.auth.dto.response;

import lombok.Builder;
import lombok.Getter;
import pro.damjan.belabackend.user.User;

import java.time.Instant;

@Getter
@Builder
public class UserResponse {
    private String id;
    private String username;
    private String email;
    private String role;
    private Instant createdAt;
    private Instant lastLoginAt;

    public static UserResponse fromUser(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}
