-- Create course_resources table
CREATE TABLE course_resources (
    course_id  BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    file_id    BIGINT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (course_id, file_id)
);

CREATE TRIGGER trg_course_resources_updated_at
    BEFORE UPDATE ON course_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create lesson_resources table
CREATE TABLE lesson_resources (
    lesson_id  BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    file_id    BIGINT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (lesson_id, file_id)
);

CREATE TRIGGER trg_lesson_resources_updated_at
    BEFORE UPDATE ON lesson_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
