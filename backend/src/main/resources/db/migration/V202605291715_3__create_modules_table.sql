CREATE TABLE modules (
  id         BIGINT PRIMARY KEY DEFAULT generate_snowflake_id(),
  course_id  BIGINT NOT NULL,
  title      VARCHAR(255) NOT NULL,
  "order"    INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT uq_modules_course_order UNIQUE (course_id, "order") DEFERRABLE INITIALLY DEFERRED
);

CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
