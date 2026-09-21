package pro.damjan.belabackend.friendships;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pro.damjan.belabackend.friendships.dto.request.RespondToFriendRequest;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.dto.response.UserProfileResponse;

import java.util.List;

@RestController
@RequestMapping("/friends")
@RequiredArgsConstructor
public class FriendshipController {

    private final FriendshipService friendshipService;

    @GetMapping
    public List<UserProfileResponse> getFriends(@AuthenticationPrincipal User user) {
        return friendshipService.getFriends(user);
    }

    @PostMapping("/requests/{receiverId}")
    public ResponseEntity<Void> sendFriendRequest(@AuthenticationPrincipal User requester,
                                                  @PathVariable String receiverId) {
        friendshipService.sendFriendRequest(requester, receiverId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PatchMapping("/requests/{requesterId}")
    public ResponseEntity<Void> respondToFriendRequest(@AuthenticationPrincipal User receiver,
                                                       @PathVariable String requesterId,
                                                       @Valid @RequestBody RespondToFriendRequest request) {
        friendshipService.respondToFriendRequest(receiver, requesterId, request.getAccepted());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{friendId}")
    public ResponseEntity<Void> unfriend(@AuthenticationPrincipal User user,
                                         @PathVariable String friendId) {
        friendshipService.unfriend(user, friendId);
        return ResponseEntity.noContent().build();
    }
}
