package pro.damjan.belabackend.auth.dto.response;

import lombok.Builder;
import lombok.Getter;
import pro.damjan.belabackend.user.User;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserResponse {
    private String id;
    private String username;
    private String email;
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

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
