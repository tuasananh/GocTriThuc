CREATE TYPE course_visibility AS ENUM ('public', 'restricted', 'private');

CREATE CAST (varchar AS course_visibility) WITH INOUT AS IMPLICIT;
CREATE CAST (course_visibility AS varchar) WITH INOUT AS IMPLICIT;
CREATE CAST (text AS course_visibility) WITH INOUT AS IMPLICIT;
CREATE CAST (course_visibility AS text) WITH INOUT AS IMPLICIT;

CREATE TABLE courses (
    id BIGINT PRIMARY KEY DEFAULT generate_snowflake_id(),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    visibility course_visibility NOT NULL DEFAULT 'private',
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    settings JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tr_courses_updated_at BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_courses_author_id ON courses (author_id);
CREATE INDEX idx_courses_visibility_published ON courses (visibility, is_published);
