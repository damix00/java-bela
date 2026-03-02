package pro.damjan.belabackend.auth.dto.response;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.user.User;

@Getter
@Setter
public class AuthResponse {

    private String jwt;
    private UserResponse user;

    public static AuthResponse fromUserAndToken(User user, String jwt) {
        AuthResponse response = new AuthResponse();
        response.setJwt(jwt);
        response.setUser(
                UserResponse.fromUser(user)
        );
        return response;
    }
}
