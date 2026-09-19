package pro.damjan.belabackend.admin.dto.response;

import java.util.List;

public record AdminAccountPageResponse(
        List<AdminAccountSummaryResponse> accounts,
        String nextCursor
) {}
