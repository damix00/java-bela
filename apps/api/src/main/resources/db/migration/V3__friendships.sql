CREATE TABLE friendships (
    id              varchar(255) NOT NULL,
    requester_id    varchar(255) NOT NULL,
    receiver_id     varchar(255) NOT NULL,
    status          varchar(255) NOT NULL,
    created_at      timestamp(6) with time zone NOT NULL,

    CONSTRAINT friendships_pkey PRIMARY KEY (id),
    CONSTRAINT friendships_requester_fk FOREIGN KEY (requester_id) REFERENCES users (id),
    CONSTRAINT friendships_receiver_fk FOREIGN KEY (receiver_id) REFERENCES users (id),
    CONSTRAINT friendships_status_check CHECK (status IN ('WAITING', 'ACCEPTED')),
    CONSTRAINT friendships_distinct_users_check CHECK (requester_id <> receiver_id)
);

-- Friend lookups always filter to accepted rows and search both directions.
CREATE INDEX idx_friendships_accepted_requester_receiver
    ON friendships (requester_id, receiver_id)
    WHERE status = 'ACCEPTED';

CREATE INDEX idx_friendships_accepted_receiver_requester
    ON friendships (receiver_id, requester_id)
    WHERE status = 'ACCEPTED';
