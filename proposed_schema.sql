CREATE SCHEMA IF NOT EXISTS "public";

-- ============================================================
-- ENUM TYPES
-- ============================================================

-- course_visibility: controls who can see/enroll in a course
CREATE TYPE "course_visibility" AS ENUM ('public', 'restricted', 'private');

CREATE CAST (varchar AS "course_visibility") WITH INOUT AS IMPLICIT;
CREATE CAST ("course_visibility" AS varchar) WITH INOUT AS IMPLICIT;
CREATE CAST (text AS "course_visibility") WITH INOUT AS IMPLICIT;
CREATE CAST ("course_visibility" AS text) WITH INOUT AS IMPLICIT;

-- lesson_type: the kind of content a lesson holds
CREATE TYPE "lesson_type" AS ENUM ('blog', 'video', 'test');

-- question_type: extensible for future question formats (e.g. fill-in-blank)
CREATE TYPE "question_type" AS ENUM ('multiple_choice');

-- video_provider: YouTube and Vimeo embed only for v1 (no direct upload)
CREATE TYPE "video_provider" AS ENUM ('youtube', 'vimeo');

-- ============================================================
-- CORE IDENTITY & AUTH TABLES
-- ============================================================

CREATE TABLE "public"."users" (
    "id"           bigint      NOT NULL DEFAULT generate_snowflake_id(),
    "email"        text        NOT NULL UNIQUE,
    "display_name" text        NOT NULL,
    "username"     text        NOT NULL UNIQUE,
    "avatar_url"   text,
    "is_active"    boolean     NOT NULL DEFAULT TRUE,
    "deleted_at"   timestamptz,
    "created_at"   timestamptz NOT NULL DEFAULT NOW(),
    "updated_at"   timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);

-- OAuth2 provider linkages (Google, GitHub) per user
CREATE TABLE "public"."user_providers" (
    "id"                  bigint      NOT NULL DEFAULT generate_snowflake_id(),
    "user_id"             bigint      NOT NULL,
    "provider_name"       text        NOT NULL,
    "provider_user_id"    text        NOT NULL,
    "created_at"          timestamptz NOT NULL DEFAULT NOW(),
    "updated_at"          timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id"),
    UNIQUE ("provider_name", "provider_user_id")
);

-- Role definitions with bitmask permissions
-- Seeded roles: admin (0x7FFFFFFFFFFFFFFF), teacher (0x3E), student (0x24)
CREATE TABLE "public"."roles" (
    "name"        text        NOT NULL,
    "permissions" bigint      NOT NULL,
    "description" text,
    "created_at"  timestamptz NOT NULL DEFAULT NOW(),
    "updated_at"  timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("name")
);

-- Many-to-many: users ↔ roles
-- Insert/delete only — no updated_at (rows are never UPDATEd; role changes = delete + insert)
CREATE TABLE "public"."user_role" (
    "user_id"    bigint      NOT NULL,
    "role_name"  text        NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("user_id", "role_name")
);

-- ============================================================
-- FILE STORAGE (local disk via Docker Volume)
-- provider_value: relative file path on disk (e.g. /uploads/abc.png)
-- provider is always 'local' for v1
-- ============================================================

CREATE TABLE "public"."files" (
    "id"             bigint      NOT NULL DEFAULT generate_snowflake_id(),
    "author_id"      bigint      NOT NULL,
    "provider"       text        NOT NULL DEFAULT 'local' CHECK ("provider" IN ('local')),
    "provider_value" text        NOT NULL,
    "mime_type"      text,
    "original_name"  text,
    "size_bytes"     bigint,
    "created_at"     timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);

-- ============================================================
-- COURSE TABLES
-- ============================================================

CREATE TABLE "public"."courses" (
    "id"            bigint           NOT NULL DEFAULT generate_snowflake_id(),
    "title"         text             NOT NULL,
    "description"   text,
    "thumbnail_url" text,
    "is_published"  boolean          NOT NULL DEFAULT FALSE,
    "visibility"    course_visibility NOT NULL DEFAULT 'private',
    "author_id"     bigint           NOT NULL,
    "settings"      jsonb,
    "created_at"    timestamptz      NOT NULL DEFAULT NOW(),
    "updated_at"    timestamptz      NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);

-- Students enrolled in a course (Public enroll directly; Restricted via approval)
CREATE TABLE "public"."enrollments" (
    "user_id"    bigint      NOT NULL,
    "course_id"  bigint      NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT NOW(),
    "updated_at" timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("user_id", "course_id")
);

-- Pending access requests for Restricted courses
-- Approval → insert to enrollments + delete row here
-- Rejection → delete row here
CREATE TABLE "public"."course_access_requests" (
    "user_id"    bigint      NOT NULL,
    "course_id"  bigint      NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("user_id", "course_id")
);

-- Downloadable files attached to a course
CREATE TABLE "public"."course_resources" (
    "id"         bigint      NOT NULL DEFAULT generate_snowflake_id(),
    "course_id"  bigint      NOT NULL,
    "file_id"    bigint      NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT NOW(),
    "updated_at" timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);

-- Instructor announcements within a course
CREATE TABLE "public"."announcements" (
    "id"         bigint      NOT NULL DEFAULT generate_snowflake_id(),
    "course_id"  bigint      NOT NULL,
    "author_id"  bigint      NOT NULL,
    "title"      text        NOT NULL,
    "content"    text        NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT NOW(),
    "updated_at" timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);

-- Threaded comments on announcements (infinite nesting via parent_id)
-- ON DELETE CASCADE on parent_id ensures children are removed with parent
CREATE TABLE "public"."announcement_comments" (
    "id"              bigint      NOT NULL DEFAULT generate_snowflake_id(),
    "announcement_id" bigint      NOT NULL,
    "user_id"         bigint      NOT NULL,
    "content"         text        NOT NULL,
    "parent_id"       bigint,
    "edited_at"       timestamptz,
    "created_at"      timestamptz NOT NULL DEFAULT NOW(),
    "updated_at"      timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);

-- ============================================================
-- CURRICULUM: MODULES & LESSONS
-- ============================================================

CREATE TABLE "public"."modules" (
    "id"         bigint      NOT NULL DEFAULT generate_snowflake_id(),
    "course_id"  bigint      NOT NULL,
    "title"      text        NOT NULL,
    "order"      int         NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT NOW(),
    "updated_at" timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id"),
    CONSTRAINT "uq_modules_course_order" UNIQUE ("course_id", "order") DEFERRABLE INITIALLY DEFERRED
);

-- Each lesson belongs to a module. lesson_type determines which subtype table to join.
CREATE TABLE "public"."lessons" (
    "id"          bigint      NOT NULL DEFAULT generate_snowflake_id(),
    "module_id"   bigint      NOT NULL,
    "title"       text        NOT NULL,
    "lesson_type" lesson_type NOT NULL,
    "order"       int         NOT NULL,
    "created_at"  timestamptz NOT NULL DEFAULT NOW(),
    "updated_at"  timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id"),
    CONSTRAINT "uq_lessons_module_order" UNIQUE ("module_id", "order") DEFERRABLE INITIALLY DEFERRED
);

-- Video lesson: stores raw YouTube/Vimeo URL, frontend renders the embed
CREATE TABLE "public"."lesson_videos" (
    "id"             bigint         NOT NULL,
    "provider"       video_provider NOT NULL,
    "provider_value" text           NOT NULL,
    "created_at"     timestamptz    NOT NULL DEFAULT NOW(),
    "updated_at"     timestamptz    NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);

-- Blog lesson: stores sanitized HTML from BlockNote editor (jsoup-cleaned on save)
CREATE TABLE "public"."lesson_blogs" (
    "id"         bigint      NOT NULL,
    "content"    text        NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT NOW(),
    "updated_at" timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);

-- Test lesson: timed multiple-choice quiz linked to a lesson
-- settings (jsonb): extensible config bag (e.g. passing_score, max_retakes)
CREATE TABLE "public"."lesson_tests" (
    "id"         bigint      NOT NULL,
    "statement"  text        NOT NULL,
    "time_limit" int         NOT NULL,
    "settings"   jsonb,
    "created_at" timestamptz NOT NULL DEFAULT NOW(),
    "updated_at" timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);

-- Downloadable files attached to a lesson
CREATE TABLE "public"."lesson_resources" (
    "id"         bigint      NOT NULL DEFAULT generate_snowflake_id(),
    "lesson_id"  bigint      NOT NULL,
    "file_id"    bigint      NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT NOW(),
    "updated_at" timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);

-- Threaded comments on lessons (infinite nesting via parent_id)
CREATE TABLE "public"."lesson_comments" (
    "id"         bigint      NOT NULL DEFAULT generate_snowflake_id(),
    "lesson_id"  bigint      NOT NULL,
    "user_id"    bigint      NOT NULL,
    "content"    text        NOT NULL,
    "parent_id"  bigint,
    "edited_at"  timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT NOW(),
    "updated_at" timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);

-- Tracks which lessons a student has marked complete
-- Insert/delete only — no updated_at (toggle = delete + insert)
CREATE TABLE "public"."lesson_completions" (
    "lesson_id"  bigint      NOT NULL,
    "user_id"    bigint      NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("user_id", "lesson_id")
);

-- ============================================================
-- QUESTION BANK & TESTS
-- ============================================================

-- Base question record. Subtypes extend via shared PK (table-per-type pattern).
CREATE TABLE "public"."questions" (
    "id"            bigint        NOT NULL DEFAULT generate_snowflake_id(),
    "author_id"     bigint        NOT NULL,
    "statement"     text          NOT NULL,
    "question_type" question_type NOT NULL,
    "created_at"    timestamptz   NOT NULL DEFAULT NOW(),
    "updated_at"    timestamptz   NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);

-- Multiple-choice subtype: choices array, correct_choices holds 0-based indices
CREATE TABLE "public"."mc_questions" (
    "id"              bigint      NOT NULL,
    "choices"         text[]      NOT NULL,
    "correct_choices" int[]       NOT NULL,
    "is_single_choice" boolean    NOT NULL,
    "created_at"      timestamptz NOT NULL DEFAULT NOW(),
    "updated_at"      timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);

-- Links questions to a test with ordering and point values
-- UNIQUE (test_id, order): prevents two questions sharing the same position in a test.
-- Reordering must be within a single transaction to avoid unique violation.
CREATE TABLE "public"."test_question" (
    "test_id"     bigint           NOT NULL,
    "question_id" bigint           NOT NULL,
    "order"       int              NOT NULL,
    "point"       double precision,
    "created_at"  timestamptz      NOT NULL DEFAULT NOW(),
    "updated_at"  timestamptz      NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("test_id", "question_id"),
    CONSTRAINT "uq_test_question_order" UNIQUE ("test_id", "order") DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================
-- QUIZ SESSION ENGINE
-- ============================================================

-- A student's active or completed quiz attempt
-- remaining_time is computed server-side: started_at + time_limit - NOW()
-- submitted_at: set when POST /api/sessions/{id}/submit is called (NULL for in-progress sessions).
--   Used for accurate "time taken" display. Cannot be derived from started_at + time_limit for early submits.
CREATE TABLE "public"."test_sessions" (
    "id"           bigint      NOT NULL DEFAULT generate_snowflake_id(),
    "user_id"      bigint      NOT NULL,
    "test_id"      bigint      NOT NULL,
    "started_at"   timestamptz NOT NULL DEFAULT NOW(),
    "submitted_at" timestamptz,
    "is_done"      boolean     NOT NULL DEFAULT FALSE,
    "created_at"   timestamptz NOT NULL DEFAULT NOW(),
    "updated_at"   timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);

-- Per-question answers autosaved during a session
-- question_answer: stores selected choice indices as a JSON array of integers (e.g. [0, 2])
CREATE TABLE "public"."test_session_answers" (
    "id"              bigint      NOT NULL DEFAULT generate_snowflake_id(),
    "session_id"      bigint      NOT NULL,
    "question_id"     bigint      NOT NULL,
    "question_answer" jsonb,
    "created_at"      timestamptz NOT NULL DEFAULT NOW(),
    "updated_at"      timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id"),
    UNIQUE ("session_id", "question_id")
);

-- ============================================================
-- FOREIGN KEY CONSTRAINTS
-- Convention: child table FK → parent table PK
-- ============================================================

-- Auth & Identity
ALTER TABLE "public"."user_providers"
    ADD CONSTRAINT "fk_user_providers_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."user_role"
    ADD CONSTRAINT "fk_user_role_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."user_role"
    ADD CONSTRAINT "fk_user_role_role_name" FOREIGN KEY ("role_name") REFERENCES "public"."roles" ("name") ON DELETE CASCADE;

-- Files
ALTER TABLE "public"."files"
    ADD CONSTRAINT "fk_files_author_id" FOREIGN KEY ("author_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE;

-- Courses
ALTER TABLE "public"."courses"
    ADD CONSTRAINT "fk_courses_author_id" FOREIGN KEY ("author_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."enrollments"
    ADD CONSTRAINT "fk_enrollments_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."enrollments"
    ADD CONSTRAINT "fk_enrollments_course_id" FOREIGN KEY ("course_id") REFERENCES "public"."courses" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."course_access_requests"
    ADD CONSTRAINT "fk_car_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."course_access_requests"
    ADD CONSTRAINT "fk_car_course_id" FOREIGN KEY ("course_id") REFERENCES "public"."courses" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."course_resources"
    ADD CONSTRAINT "fk_course_resources_course_id" FOREIGN KEY ("course_id") REFERENCES "public"."courses" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."course_resources"
    ADD CONSTRAINT "fk_course_resources_file_id" FOREIGN KEY ("file_id") REFERENCES "public"."files" ("id") ON DELETE CASCADE;

-- Announcements
ALTER TABLE "public"."announcements"
    ADD CONSTRAINT "fk_announcements_course_id" FOREIGN KEY ("course_id") REFERENCES "public"."courses" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."announcements"
    ADD CONSTRAINT "fk_announcements_author_id" FOREIGN KEY ("author_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."announcement_comments"
    ADD CONSTRAINT "fk_ann_comments_announcement_id" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."announcement_comments"
    ADD CONSTRAINT "fk_ann_comments_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."announcement_comments"
    ADD CONSTRAINT "fk_ann_comments_parent_id" FOREIGN KEY ("parent_id") REFERENCES "public"."announcement_comments" ("id") ON DELETE CASCADE;

-- Curriculum
ALTER TABLE "public"."modules"
    ADD CONSTRAINT "fk_modules_course_id" FOREIGN KEY ("course_id") REFERENCES "public"."courses" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."lessons"
    ADD CONSTRAINT "fk_lessons_module_id" FOREIGN KEY ("module_id") REFERENCES "public"."modules" ("id") ON DELETE CASCADE;

-- Lesson subtypes (table-per-type: share PK with lessons)
ALTER TABLE "public"."lesson_videos"
    ADD CONSTRAINT "fk_lesson_videos_id" FOREIGN KEY ("id") REFERENCES "public"."lessons" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."lesson_blogs"
    ADD CONSTRAINT "fk_lesson_blogs_id" FOREIGN KEY ("id") REFERENCES "public"."lessons" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."lesson_tests"
    ADD CONSTRAINT "fk_lesson_tests_id" FOREIGN KEY ("id") REFERENCES "public"."lessons" ("id") ON DELETE CASCADE;

-- Lesson resources & comments
ALTER TABLE "public"."lesson_resources"
    ADD CONSTRAINT "fk_lesson_resources_lesson_id" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."lesson_resources"
    ADD CONSTRAINT "fk_lesson_resources_file_id" FOREIGN KEY ("file_id") REFERENCES "public"."files" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."lesson_comments"
    ADD CONSTRAINT "fk_lesson_comments_lesson_id" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."lesson_comments"
    ADD CONSTRAINT "fk_lesson_comments_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."lesson_comments"
    ADD CONSTRAINT "fk_lesson_comments_parent_id" FOREIGN KEY ("parent_id") REFERENCES "public"."lesson_comments" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."lesson_completions"
    ADD CONSTRAINT "fk_lesson_completions_lesson_id" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."lesson_completions"
    ADD CONSTRAINT "fk_lesson_completions_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE;

-- Questions
ALTER TABLE "public"."questions"
    ADD CONSTRAINT "fk_questions_author_id" FOREIGN KEY ("author_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."mc_questions"
    ADD CONSTRAINT "fk_mc_questions_id" FOREIGN KEY ("id") REFERENCES "public"."questions" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."test_question"
    ADD CONSTRAINT "fk_test_question_test_id" FOREIGN KEY ("test_id") REFERENCES "public"."lesson_tests" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."test_question"
    ADD CONSTRAINT "fk_test_question_question_id" FOREIGN KEY ("question_id") REFERENCES "public"."questions" ("id") ON DELETE CASCADE;

-- Test sessions
ALTER TABLE "public"."test_sessions"
    ADD CONSTRAINT "fk_test_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."test_sessions"
    ADD CONSTRAINT "fk_test_sessions_test_id" FOREIGN KEY ("test_id") REFERENCES "public"."lesson_tests" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."test_session_answers"
    ADD CONSTRAINT "fk_tsa_session_id" FOREIGN KEY ("session_id") REFERENCES "public"."test_sessions" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."test_session_answers"
    ADD CONSTRAINT "fk_tsa_question_id" FOREIGN KEY ("question_id") REFERENCES "public"."questions" ("id") ON DELETE CASCADE;

-- ============================================================
-- AUTO-UPDATE TRIGGER (updated_at)
-- A single shared trigger function is registered as BEFORE UPDATE
-- on every table that has an updated_at column.
-- This enforces updated_at at the DB level regardless of whether
-- the row is mutated via JPA, Flyway, or raw SQL.
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auth & Identity
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON "public"."users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_providers_updated_at
    BEFORE UPDATE ON "public"."user_providers"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_roles_updated_at
    BEFORE UPDATE ON "public"."roles"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- user_role has no updated_at column (insert/delete only table — trigger removed)

-- Courses & Enrollment
CREATE TRIGGER trg_courses_updated_at
    BEFORE UPDATE ON "public"."courses"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_enrollments_updated_at
    BEFORE UPDATE ON "public"."enrollments"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_course_resources_updated_at
    BEFORE UPDATE ON "public"."course_resources"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Announcements & Comments
CREATE TRIGGER trg_announcements_updated_at
    BEFORE UPDATE ON "public"."announcements"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_ann_comments_updated_at
    BEFORE UPDATE ON "public"."announcement_comments"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Curriculum
CREATE TRIGGER trg_modules_updated_at
    BEFORE UPDATE ON "public"."modules"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_lessons_updated_at
    BEFORE UPDATE ON "public"."lessons"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_lesson_videos_updated_at
    BEFORE UPDATE ON "public"."lesson_videos"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_lesson_blogs_updated_at
    BEFORE UPDATE ON "public"."lesson_blogs"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_lesson_tests_updated_at
    BEFORE UPDATE ON "public"."lesson_tests"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_lesson_resources_updated_at
    BEFORE UPDATE ON "public"."lesson_resources"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_lesson_comments_updated_at
    BEFORE UPDATE ON "public"."lesson_comments"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- lesson_completions has no updated_at column (insert/delete only table — trigger removed)

-- Questions & Tests
CREATE TRIGGER trg_questions_updated_at
    BEFORE UPDATE ON "public"."questions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_mc_questions_updated_at
    BEFORE UPDATE ON "public"."mc_questions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_test_question_updated_at
    BEFORE UPDATE ON "public"."test_question"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_test_sessions_updated_at
    BEFORE UPDATE ON "public"."test_sessions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tsa_updated_at
    BEFORE UPDATE ON "public"."test_session_answers"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PERFORMANCE INDEXES
-- Covers the most common query patterns identified in the SRS.
-- ============================================================

-- Student's enrolled courses (student dashboard, progress queries)
CREATE INDEX idx_enrollments_user_id
    ON "public"."enrollments" ("user_id");

-- Instructor's authored courses (instructor dashboard, "My Courses" listing)
CREATE INDEX idx_courses_author_id
    ON "public"."courses" ("author_id");

-- Curriculum ordering (module/lesson navigation)
CREATE INDEX idx_modules_course_order
    ON "public"."modules" ("course_id", "order");

CREATE INDEX idx_lessons_module_order
    ON "public"."lessons" ("module_id", "order");

-- Active session lookup (cheat prevention + resume flow)
CREATE INDEX idx_test_sessions_user_test_done
    ON "public"."test_sessions" ("user_id", "test_id", "is_done");

CREATE UNIQUE INDEX idx_unique_active_test_session
    ON "public"."test_sessions" ("user_id", "test_id")
    WHERE ("is_done" = FALSE);

-- Course discovery (public listing + visibility filter)
CREATE INDEX idx_courses_visibility_published
    ON "public"."courses" ("visibility", "is_published");

-- Comment thread lookup (root comments + nested replies)
CREATE INDEX idx_lesson_comments_lesson
    ON "public"."lesson_comments" ("lesson_id", "parent_id");

CREATE INDEX idx_ann_comments_announcement
    ON "public"."announcement_comments" ("announcement_id", "parent_id");

-- Pending access requests per course (instructor dashboard)
CREATE INDEX idx_car_course_id
    ON "public"."course_access_requests" ("course_id");

-- Question bank per instructor
CREATE INDEX idx_questions_author_id
    ON "public"."questions" ("author_id");

-- File lookup by uploader (for file management / cleanup)
CREATE INDEX idx_files_author_id
    ON "public"."files" ("author_id");
