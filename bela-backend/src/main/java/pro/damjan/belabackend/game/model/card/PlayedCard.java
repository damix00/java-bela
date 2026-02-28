package pro.damjan.belabackend.game.model.card;

import java.io.Serializable;

public record PlayedCard(String userId, Card card) implements Serializable {}