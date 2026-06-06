-- 1. Create test_sessions table
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

-- 2. Create test_session_answers table
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

-- 3. Add Foreign Key Constraints
ALTER TABLE "public"."test_sessions"
    ADD CONSTRAINT "fk_test_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."test_sessions"
    ADD CONSTRAINT "fk_test_sessions_test_id" FOREIGN KEY ("test_id") REFERENCES "public"."lesson_tests" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."test_session_answers"
    ADD CONSTRAINT "fk_tsa_session_id" FOREIGN KEY ("session_id") REFERENCES "public"."test_sessions" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."test_session_answers"
    ADD CONSTRAINT "fk_tsa_question_id" FOREIGN KEY ("question_id") REFERENCES "public"."questions" ("id") ON DELETE CASCADE;

-- 4. Create Triggers
CREATE TRIGGER trg_test_sessions_updated_at
    BEFORE UPDATE ON "public"."test_sessions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tsa_updated_at
    BEFORE UPDATE ON "public"."test_session_answers"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Create Indexes
CREATE INDEX idx_test_sessions_user_test_done
    ON "public"."test_sessions" ("user_id", "test_id", "is_done");

CREATE UNIQUE INDEX idx_unique_active_test_session
    ON "public"."test_sessions" ("user_id", "test_id")
    WHERE ("is_done" = FALSE);
