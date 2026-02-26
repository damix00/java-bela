package pro.damjan.belabackend.auth.dto;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.user.User;

@Getter
@Setter
public class LoginRequest {
    private String usernameOrEmail;
    private String password;
}
