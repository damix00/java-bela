package pro.damjan.belabackend.friendships.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RespondToFriendRequest {

    @NotNull(message = "accepted is required")
    private Boolean accepted;
}
