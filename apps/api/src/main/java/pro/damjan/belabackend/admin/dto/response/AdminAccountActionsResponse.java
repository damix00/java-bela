package pro.damjan.belabackend.admin.dto.response;

public record AdminAccountActionsResponse(
        boolean canForceSignOut,
        boolean canChangeRole,
        boolean canDelete,
        String roleChangeBlockedReason,
        String deletionBlockedReason
) {}
