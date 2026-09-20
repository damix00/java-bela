package pro.damjan.belabackend.user.dto.response;

import lombok.Builder;
import lombok.Getter;
import pro.damjan.belabackend.friendships.FriendshipStatus;

import java.io.Serializable;

@Getter
@Builder
public class UserProfileResponse implements Serializable {
    private PublicUserResponse user;
    private boolean online;
    private FriendshipStatus friendship;
}
