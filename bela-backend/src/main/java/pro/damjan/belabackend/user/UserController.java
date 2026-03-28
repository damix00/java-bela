package pro.damjan.belabackend.user;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pro.damjan.belabackend.exception.codes.NotFoundException;
import pro.damjan.belabackend.user.dto.response.PublicUserResponse;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public PublicUserResponse getUserById(@PathVariable String id) {
        User user = userService.getUserById(id);

        if (user == null) {
            throw new NotFoundException();
        }

        return PublicUserResponse.fromUser(user);
    }
}
