-- 0001_init.sql
-- Users and sessions.

BEGIN;

CREATE TABLE users (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text        NOT NULL,
  password_hash text        NOT NULL,
  display_name  text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT users_email_not_blank
    CHECK (length(btrim(email)) > 0),
  CONSTRAINT users_display_name_not_blank
    CHECK (length(btrim(display_name)) > 0)
);

-- Case-insensitive uniqueness: Sam@x.com and sam@x.com are one account.
CREATE UNIQUE INDEX users_email_lower_key ON users (lower(email));

CREATE TABLE sessions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text        NOT NULL UNIQUE,
  user_id    uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  ip         inet
);

-- "Log out everywhere" and the "your devices" list both filter by user.
CREATE INDEX sessions_user_id_idx ON sessions (user_id);

-- Deleting expired sessions scans this.
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

COMMIT;