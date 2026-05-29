CREATE TYPE lesson_type AS ENUM ('video', 'blog', 'test');

CREATE TABLE lessons (
  id          BIGINT PRIMARY KEY DEFAULT generate_snowflake_id(),
  module_id   BIGINT NOT NULL,
  title       VARCHAR(255) NOT NULL,
  lesson_type lesson_type NOT NULL,
  "order"     INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  CONSTRAINT uq_lessons_module_order UNIQUE (module_id, "order") DEFERRABLE INITIALLY DEFERRED
);

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
