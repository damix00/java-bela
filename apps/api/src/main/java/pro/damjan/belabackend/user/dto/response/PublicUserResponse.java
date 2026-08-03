package pro.damjan.belabackend.user.dto.response;

import lombok.Builder;
import lombok.Getter;
import pro.damjan.belabackend.user.User;

import java.time.Instant;

@Getter
@Builder
public class PublicUserResponse {
    private String id;
    private String username;
    private String avatarUrl;
    private Instant createdAt;

    public static PublicUserResponse fromUser(User user) {
        return PublicUserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
