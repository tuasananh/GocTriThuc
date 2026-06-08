CREATE TABLE announcements (
    id BIGINT PRIMARY KEY DEFAULT generate_snowflake_id(),
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lesson_comments (
    id BIGINT PRIMARY KEY DEFAULT generate_snowflake_id(),
    lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES lesson_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    edited_at TIMESTAMPTZ
);

CREATE TABLE announcement_comments (
    id BIGINT PRIMARY KEY DEFAULT generate_snowflake_id(),
    announcement_id BIGINT NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES announcement_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    edited_at TIMESTAMPTZ
);

CREATE TRIGGER tr_announcements_updated_at BEFORE UPDATE ON announcements
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_lesson_comments_updated_at BEFORE UPDATE ON lesson_comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_announcement_comments_updated_at BEFORE UPDATE ON announcement_comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
