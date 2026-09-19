ALTER TABLE users
    ADD COLUMN credentials_valid_after timestamp(6) with time zone;

CREATE TABLE admin_audit_log (
    id                  varchar(255) NOT NULL,
    actor_user_id       varchar(255) NOT NULL,
    actor_username      varchar(255) NOT NULL,
    target_user_id      varchar(255) NOT NULL,
    target_username     varchar(255) NOT NULL,
    target_email        varchar(255),
    action              varchar(64) NOT NULL,
    details             varchar(1000),
    created_at          timestamp(6) with time zone NOT NULL,

    CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id),
    CONSTRAINT admin_audit_log_action_check CHECK (
        action IN ('FORCE_SIGN_OUT', 'ROLE_CHANGED', 'ACCOUNT_DELETED')
    )
);

CREATE INDEX idx_admin_audit_target_created
    ON admin_audit_log (target_user_id, created_at DESC);
CREATE INDEX idx_admin_audit_actor_created
    ON admin_audit_log (actor_user_id, created_at DESC);
