package pro.damjan.belabackend.game.model;

import lombok.Getter;

import java.io.Serializable;

@Getter
public class Team implements Serializable {
    private String id;

    private int pointsThisRound;
    private int totalPoints;

    public void addPoints(int points) {
        this.pointsThisRound += points;
    }

    public void resetPointsThisRound() {
        this.pointsThisRound = 0;
    }

    public void finishRound() {
        this.totalPoints += this.pointsThisRound;
        resetPointsThisRound();
    }

}
