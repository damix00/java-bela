package pro.damjan.belabackend.admin.account;

public record AdminAccountSignedOutEvent(String userId, boolean deletePresence) {}
