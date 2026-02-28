package pro.damjan.belabackend.game.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/games")
public class GameController {

    @PostMapping("/create")
    public String createGame() {
        return "a";
    }

}
