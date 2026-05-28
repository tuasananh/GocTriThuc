CREATE TABLE courses (
    id BIGINT PRIMARY KEY DEFAULT generate_snowflake_id(),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    visibility VARCHAR(20) NOT NULL DEFAULT 'Private' CHECK (visibility IN ('Public', 'Restricted', 'Private')),
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    settings JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tr_courses_updated_at BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_courses_author_id ON courses (author_id);
CREATE INDEX idx_courses_visibility_published ON courses (visibility, is_published);
