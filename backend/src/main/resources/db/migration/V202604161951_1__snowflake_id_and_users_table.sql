CREATE SEQUENCE IF NOT EXISTS global_id_sequence;

CREATE OR REPLACE FUNCTION generate_snowflake_id()
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    -- April 16, 2026 at midnight UTC in milliseconds.
    our_epoch BIGINT := 1776297600000; 
    
    seq_id BIGINT;
    now_millis BIGINT;
    
    shard_id INT := 1; 
    
    result BIGINT;
BEGIN
    SELECT nextval('global_id_sequence') % 1024 INTO seq_id;

    -- Get current time in milliseconds
    SELECT FLOOR(EXTRACT(EPOCH FROM clock_timestamp()) * 1000) INTO now_millis;

    result := (now_millis - our_epoch) << 17; -- Shift time 17 bits left (7 shard + 10 seq)
    result := result | (shard_id << 10);      -- Shift shard ID 10 bits left and merge
    result := result | (seq_id);              -- Merge the sequence in the remaining 10 bits

    RETURN result;
END;
$$;

CREATE TABLE users (
    id BIGINT PRIMARY KEY DEFAULT generate_snowflake_id(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_providers (
    id BIGINT PRIMARY KEY DEFAULT generate_snowflake_id(),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider_name, provider_user_id)
);
