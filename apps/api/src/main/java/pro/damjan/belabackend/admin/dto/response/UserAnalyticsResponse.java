package pro.damjan.belabackend.admin.dto.response;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class UserAnalyticsResponse {
    private long total;
    private long registered;
    private long guests;
    private long admins;
    private long registeredLast24Hours;
    private long registeredLast7Days;
    private long registeredLast30Days;
}
