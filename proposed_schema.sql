CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "course_access_status" AS ENUM ('requested', 'accepted');
CREATE TYPE "course_visibility" AS ENUM ('Public', 'Restricted', 'Private');
CREATE TYPE "file_provider" AS ENUM ('cloudinary', 'supabase', 'aws_s3');
CREATE TYPE "lesson_type" AS ENUM ('blog', 'video', 'test');
CREATE TYPE "question_type" AS ENUM ('multiple_choice');
CREATE TYPE "video_provider" AS ENUM ('youtube', 'vimeo', 'uploaded');

CREATE TABLE "public"."users" (
    "id" bigint NOT NULL,
    "email" text NOT NULL UNIQUE,
    "display_name" text NOT NULL,
    "username" text NOT NULL UNIQUE,
    "avatar_url" text,
    "updated_at" timestamptz NOT NULL,
    "created_at" timestamptz NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."courses" (
    "id" bigint NOT NULL,
    "title" text NOT NULL,
    "description" bigint NOT NULL,
    "thumbnail_url" bigint,
    "is_published" boolean NOT NULL,
    "created_at" bigint NOT NULL,
    "updated_at" bigint NOT NULL,
    "visibility" course_visibility NOT NULL,
    "author_id" bigint NOT NULL,
    "settings" bigint NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."user_providers" (
    "id" bigint NOT NULL,
    "user_id" bigint NOT NULL,
    "provider" text NOT NULL,
    "provider_account_id" text NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_at" timestamptz NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."user_role" (
    "user_id" bigint NOT NULL,
    "role_name" text NOT NULL,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    PRIMARY KEY ("user_id", "role_name")
);

CREATE TABLE "public"."role" (
    "name" text NOT NULL,
    "permissions" bigint NOT NULL,
    "description" text,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    PRIMARY KEY ("name")
);

CREATE TABLE "public"."announcements" (
    "id" bigint NOT NULL,
    "course_id" bigint NOT NULL,
    "title" text NOT NULL,
    "content" text NOT NULL,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."enrollments" (
    "user_id" bigint NOT NULL,
    "course_id" bigint NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_at" timestamptz NOT NULL,
    PRIMARY KEY ("user_id", "course_id")
);

CREATE TABLE "public"."announcement_comments" (
    "id" bigint NOT NULL,
    "user_id" bigint NOT NULL,
    "content" text NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_at" timestamptz NOT NULL,
    "announcement_id" bigint NOT NULL,
    "parent_id" bigint,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."modules" (
    "id" bigint NOT NULL,
    "course_id" bigint NOT NULL,
    "title" text NOT NULL,
    "order" int NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_at" timestamptz NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."lessons" (
    "id" bigint NOT NULL,
    "title" text NOT NULL,
    "lesson_type" lesson_type NOT NULL,
    "order" int NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_at" timestamptz NOT NULL,
    "module_id" bigint NOT NULL,
    PRIMARY KEY ("id", "title")
);

CREATE TABLE "public"."lesson_videos" (
    "id" bigint NOT NULL,
    "provider_value" text NOT NULL,
    "provider" video_provider NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_at" timestamptz NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."lesson_blogs" (
    "id" bigint NOT NULL,
    "content" text NOT NULL,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."lesson_tests" (
    "id" bigint NOT NULL,
    "statement" text NOT NULL,
    "settings" bigint NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_at" timestamptz NOT NULL,
    "time_limit" int NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."questions" (
    "id" bigint NOT NULL,
    "statement" text NOT NULL,
    "author_id" bigint NOT NULL,
    "question_type" question_type NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_at" timestamptz NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."mc_questions" (
    "id" bigint NOT NULL,
    "choices" text[] NOT NULL,
    "correct_choices" int[] NOT NULL,
    "is_single_choice" boolean NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_at" timestamptz NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."test_question" (
    "test_id" bigint NOT NULL,
    "question_id" bigint NOT NULL,
    "order" int NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_at" timestamptz NOT NULL,
    "point" double precision,
    PRIMARY KEY ("test_id", "question_id")
);

CREATE TABLE "public"."lesson_resources" (
    "id" bigint NOT NULL,
    "lesson_id" bigint NOT NULL,
    "file_id" bigint NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_at" timestamptz NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."files" (
    "id" bigint NOT NULL,
    "author_id" bigint NOT NULL,
    "provider" file_provider NOT NULL,
    "provider_value" text NOT NULL,
    "created_at" timestamptz,
    "uploaded_at" timestamptz,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."course_resources" (
    "id" bigint NOT NULL,
    "course_id" bigint NOT NULL,
    "file_id" bigint NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_at" timestamptz NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."lesson_comments" (
    "id" bigint NOT NULL,
    "user_id" bigint NOT NULL,
    "content" text NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_at" timestamptz NOT NULL,
    "lesson_id" bigint NOT NULL,
    "parent_id" bigint,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."test_sessions" (
    "id" bigint NOT NULL,
    "user_id" bigint NOT NULL,
    "test_id" bigint NOT NULL,
    "started_at" timestamptz NOT NULL,
    "is_done" boolean NOT NULL,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."test_session_answers" (
    "id" bigint NOT NULL,
    "question_id" bigint NOT NULL,
    "question_answer" text,
    "session_id" bigint NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_at" timestamptz NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."lesson_completions" (
    "lesson_id" bigint NOT NULL,
    "user_id" bigint NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_at" timestamptz NOT NULL,
    PRIMARY KEY ("lesson_id", "user_id")
);

-- Foreign key constraints
-- Schema: public
ALTER TABLE "public"."user_providers" ADD CONSTRAINT "fk_user_providers_user_id_users_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("id");
ALTER TABLE "public"."courses" ADD CONSTRAINT "fk_courses_author_id_users_id" FOREIGN KEY("author_id") REFERENCES "public"."users"("id");
ALTER TABLE "public"."role" ADD CONSTRAINT "fk_role_name_user_role_role_name" FOREIGN KEY("name") REFERENCES "public"."user_role"("role_name");
ALTER TABLE "public"."users" ADD CONSTRAINT "fk_users_id_user_role_user_id" FOREIGN KEY("id") REFERENCES "public"."user_role"("user_id");
ALTER TABLE "public"."courses" ADD CONSTRAINT "fk_courses_id_announcements_course_id" FOREIGN KEY("id") REFERENCES "public"."announcements"("course_id");
ALTER TABLE "public"."users" ADD CONSTRAINT "fk_users_id_announcement_comments_user_id" FOREIGN KEY("id") REFERENCES "public"."announcement_comments"("user_id");
ALTER TABLE "public"."announcements" ADD CONSTRAINT "fk_announcements_id_announcement_comments_announcement_id" FOREIGN KEY("id") REFERENCES "public"."announcement_comments"("announcement_id");
ALTER TABLE "public"."modules" ADD CONSTRAINT "fk_modules_course_id_courses_id" FOREIGN KEY("course_id") REFERENCES "public"."courses"("id");
ALTER TABLE "public"."lessons" ADD CONSTRAINT "fk_lessons_module_id_modules_id" FOREIGN KEY("module_id") REFERENCES "public"."modules"("id");
ALTER TABLE "public"."lessons" ADD CONSTRAINT "fk_lessons_id_lesson_videos_id" FOREIGN KEY("id") REFERENCES "public"."lesson_videos"("id");
ALTER TABLE "public"."lessons" ADD CONSTRAINT "fk_lessons_id_lesson_blogs_id" FOREIGN KEY("id") REFERENCES "public"."lesson_blogs"("id");
ALTER TABLE "public"."questions" ADD CONSTRAINT "fk_questions_id_mc_questions_id" FOREIGN KEY("id") REFERENCES "public"."mc_questions"("id");
ALTER TABLE "public"."test_question" ADD CONSTRAINT "fk_test_question_test_id_lesson_tests_id" FOREIGN KEY("test_id") REFERENCES "public"."lesson_tests"("id");
ALTER TABLE "public"."questions" ADD CONSTRAINT "fk_questions_id_test_question_question_id" FOREIGN KEY("id") REFERENCES "public"."test_question"("question_id");
ALTER TABLE "public"."lesson_tests" ADD CONSTRAINT "fk_lesson_tests_id_lessons_id" FOREIGN KEY("id") REFERENCES "public"."lessons"("id");
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "fk_enrollments_course_id_courses_id" FOREIGN KEY("course_id") REFERENCES "public"."courses"("id");
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "fk_enrollments_user_id_users_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("id");
ALTER TABLE "public"."questions" ADD CONSTRAINT "fk_questions_author_id_users_id" FOREIGN KEY("author_id") REFERENCES "public"."users"("id");
ALTER TABLE "public"."lesson_resources" ADD CONSTRAINT "fk_lesson_resources_lesson_id_lessons_id" FOREIGN KEY("lesson_id") REFERENCES "public"."lessons"("id");
ALTER TABLE "public"."files" ADD CONSTRAINT "fk_files_id_lesson_resources_file_id" FOREIGN KEY("id") REFERENCES "public"."lesson_resources"("file_id");
ALTER TABLE "public"."files" ADD CONSTRAINT "fk_files_id_course_resources_file_id" FOREIGN KEY("id") REFERENCES "public"."course_resources"("file_id");
ALTER TABLE "public"."users" ADD CONSTRAINT "fk_users_id_files_author_id" FOREIGN KEY("id") REFERENCES "public"."files"("author_id");
ALTER TABLE "public"."course_resources" ADD CONSTRAINT "fk_course_resources_course_id_courses_id" FOREIGN KEY("course_id") REFERENCES "public"."courses"("id");
ALTER TABLE "public"."announcement_comments" ADD CONSTRAINT "fk_announcement_comments_parent_id_announcement_comments_id" FOREIGN KEY("parent_id") REFERENCES "public"."announcement_comments"("id");
ALTER TABLE "public"."users" ADD CONSTRAINT "fk_users_id_lesson_comments_user_id" FOREIGN KEY("id") REFERENCES "public"."lesson_comments"("user_id");
ALTER TABLE "public"."lessons" ADD CONSTRAINT "fk_lessons_id_lesson_comments_lesson_id" FOREIGN KEY("id") REFERENCES "public"."lesson_comments"("lesson_id");
ALTER TABLE "public"."lesson_comments" ADD CONSTRAINT "fk_lesson_comments_parent_id_lesson_comments_id" FOREIGN KEY("parent_id") REFERENCES "public"."lesson_comments"("id");
ALTER TABLE "public"."lesson_tests" ADD CONSTRAINT "fk_lesson_tests_id_test_sessions_test_id" FOREIGN KEY("id") REFERENCES "public"."test_sessions"("test_id");
ALTER TABLE "public"."users" ADD CONSTRAINT "fk_users_id_test_sessions_user_id" FOREIGN KEY("id") REFERENCES "public"."test_sessions"("user_id");
ALTER TABLE "public"."test_sessions" ADD CONSTRAINT "fk_test_sessions_id_test_session_answers_session_id" FOREIGN KEY("id") REFERENCES "public"."test_session_answers"("session_id");
ALTER TABLE "public"."questions" ADD CONSTRAINT "fk_questions_id_test_session_answers_question_id" FOREIGN KEY("id") REFERENCES "public"."test_session_answers"("question_id");
ALTER TABLE "public"."lessons" ADD CONSTRAINT "fk_lessons_id_lesson_completions_lesson_id" FOREIGN KEY("id") REFERENCES "public"."lesson_completions"("lesson_id");
ALTER TABLE "public"."users" ADD CONSTRAINT "fk_users_id_lesson_completions_user_id" FOREIGN KEY("id") REFERENCES "public"."lesson_completions"("user_id");