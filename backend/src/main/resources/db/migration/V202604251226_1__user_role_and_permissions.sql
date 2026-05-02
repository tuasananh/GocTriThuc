CREATE TABLE roles (
    name TEXT PRIMARY KEY NOT NULL,
    permissions BIGINT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE user_role (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL REFERENCES roles(name) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_name)
);



-- The permissions are:
-- Bit 0: Admin access
-- Bit 1: Manage Own Courses
-- Bit 2: Enroll Available Courses
-- Bit 3: Manage Own Questions
-- Bit 4: Manage Own Tests
-- Bit 5: Access Tests

INSERT INTO roles (name, permissions, description) VALUES
    ('admin', 0x7FFFFFFFFFFFFFFF, 'Full access to all features and settings.'),
    ('teacher', 0x3E, 'Can manage their own courses, questions, and tests, access courses and tests too'),
    ('student', 0x24, 'Can enroll in available courses and access tests, but cannot manage any content.');

CREATE TRIGGER tr_roles_updated_at BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_user_role_updated_at BEFORE UPDATE ON user_role
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
