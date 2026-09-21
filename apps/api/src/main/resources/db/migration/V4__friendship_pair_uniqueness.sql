-- Removing an expiring guest account must also remove relationships that point
-- to it; otherwise the hourly guest cleanup is blocked by these foreign keys.
ALTER TABLE friendships DROP CONSTRAINT friendships_requester_fk;
ALTER TABLE friendships DROP CONSTRAINT friendships_receiver_fk;

ALTER TABLE friendships
    ADD CONSTRAINT friendships_requester_fk
        FOREIGN KEY (requester_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE friendships
    ADD CONSTRAINT friendships_receiver_fk
        FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE CASCADE;

-- A pair can have at most one relationship, regardless of who sent the request.
-- Besides preventing duplicates, this closes the simultaneous cross-request race.
CREATE UNIQUE INDEX uk_friendships_user_pair
    ON friendships (LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id));
