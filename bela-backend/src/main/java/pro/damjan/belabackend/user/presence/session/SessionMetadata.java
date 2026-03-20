package pro.damjan.belabackend.user.presence.session;

import lombok.Builder;
import lombok.Getter;

import java.io.Serializable;

@Builder
public record SessionMetadata(
        String userAgent,
        String ipAddress
) implements Serializable {
    public String getUserAgent() {
        return userAgent;
    }

    public String getIpAddress() {
        return ipAddress;
    }
}
