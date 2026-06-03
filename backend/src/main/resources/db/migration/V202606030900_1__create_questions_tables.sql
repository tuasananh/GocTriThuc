-- 1. Create enum type for question type
CREATE TYPE question_type AS ENUM ('multiple_choice');

-- 2. Create casts for question type mapping
CREATE CAST (varchar AS question_type) WITH INOUT AS IMPLICIT;
CREATE CAST (question_type AS varchar) WITH INOUT AS IMPLICIT;
CREATE CAST (text AS question_type) WITH INOUT AS IMPLICIT;
CREATE CAST (question_type AS text) WITH INOUT AS IMPLICIT;

-- 3. Create questions table
CREATE TABLE "public"."questions" (
    "id"            bigint        NOT NULL DEFAULT generate_snowflake_id(),
    "author_id"     bigint        NOT NULL,
    "statement"     text          NOT NULL,
    "question_type" question_type NOT NULL,
    "created_at"    timestamptz   NOT NULL DEFAULT NOW(),
    "updated_at"    timestamptz   NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);

-- 4. Create mc_questions table
CREATE TABLE "public"."mc_questions" (
    "id"              bigint      NOT NULL,
    "choices"         text[]      NOT NULL,
    "correct_choices" int[]       NOT NULL,
    "is_single_choice" boolean    NOT NULL,
    "created_at"      timestamptz NOT NULL DEFAULT NOW(),
    "updated_at"      timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);

-- 5. Create test_question table
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

-- 6. Add Foreign Key Constraints
ALTER TABLE "public"."questions"
    ADD CONSTRAINT "fk_questions_author_id" FOREIGN KEY ("author_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."mc_questions"
    ADD CONSTRAINT "fk_mc_questions_id" FOREIGN KEY ("id") REFERENCES "public"."questions" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."test_question"
    ADD CONSTRAINT "fk_test_question_test_id" FOREIGN KEY ("test_id") REFERENCES "public"."lesson_tests" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."test_question"
    ADD CONSTRAINT "fk_test_question_question_id" FOREIGN KEY ("question_id") REFERENCES "public"."questions" ("id") ON DELETE CASCADE;

-- 7. Triggers
CREATE TRIGGER trg_questions_updated_at
    BEFORE UPDATE ON "public"."questions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_mc_questions_updated_at
    BEFORE UPDATE ON "public"."mc_questions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_test_question_updated_at
    BEFORE UPDATE ON "public"."test_question"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Indexes
CREATE INDEX idx_questions_author_id
    ON "public"."questions" ("author_id");
