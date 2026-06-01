-- 1. Create enum type for video provider
CREATE TYPE video_provider AS ENUM ('youtube', 'vimeo');

-- 2. Create casts for video provider mapping
CREATE CAST (varchar AS video_provider) WITH INOUT AS IMPLICIT;
CREATE CAST (video_provider AS varchar) WITH INOUT AS IMPLICIT;
CREATE CAST (text AS video_provider) WITH INOUT AS IMPLICIT;
CREATE CAST (video_provider AS text) WITH INOUT AS IMPLICIT;

-- 3. Create lesson_videos table
CREATE TABLE lesson_videos (
  id             BIGINT PRIMARY KEY,
  provider       video_provider NOT NULL,
  provider_value TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TRIGGER trg_lesson_videos_updated_at
  BEFORE UPDATE ON lesson_videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Create lesson_blogs table
CREATE TABLE lesson_blogs (
  id         BIGINT PRIMARY KEY,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TRIGGER trg_lesson_blogs_updated_at
  BEFORE UPDATE ON lesson_blogs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Create lesson_tests table
CREATE TABLE lesson_tests (
  id         BIGINT PRIMARY KEY,
  statement  TEXT NOT NULL,
  time_limit INT NOT NULL,
  settings   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TRIGGER trg_lesson_tests_updated_at
  BEFORE UPDATE ON lesson_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
