package pro.damjan.belabackend.friendships;

/** The relationship as seen by the authenticated user viewing a profile. */
public enum FriendshipRelationStatus {
    NONE,
    OUTGOING_REQUEST,
    INCOMING_REQUEST,
    FRIENDS
}
