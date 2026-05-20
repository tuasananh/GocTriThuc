# GocTriThuc — Finalized Feature Plan & 2-Week Development Roadmap

**GocTriThuc** ("Corner of Knowledge") is an e-learning platform built with:
- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Backend**: Spring Boot 4 + Java 21 + JPA + PostgreSQL + Flyway
- **Auth**: OAuth2 (Google) via Spring Security, session-based with CSRF protection

---

## ✅ Resolved Design Decisions

| # | Decision | Resolution |
|---|----------|------------|
| Q1 | `description`, `thumbnail_url`, `settings` column types on `courses` | Fix to **`text`** — were typos using `bigint` |
| Q2 | Permission model | **Bitmask `bigint`** — keep and define concrete bit constants |
| Q3 | File storage provider | **Cloudinary only** for v1 |
| Q4 | Video provider | **YouTube + Vimeo embed only** for v1; `uploaded` deferred |
| Q5 | Question types | **`multiple_choice` only** for v1; schema is extensible for the future |
| Q6 | Restricted course access approval | **Course author OR admin** can approve; no "denied" state — requests can be **deleted**, students can re-request |
| Q7 | `lessons` PRIMARY KEY | Fix to **`PRIMARY KEY (id)`** — composite PK was a typo |
| Q8 | Comment tables | **Keep separate** — `lesson_comments` below each lesson, `announcement_comments` below each announcement |
| Extra | Guest role | Unauthenticated users are implicitly **"guest"** — enforced via Spring Security, not stored in DB |

---

## Schema Corrections (Flyway Migration Required)

The following must be fixed in the first migration before any feature work:

```sql
-- Fix courses table (bigint columns were typos)
ALTER TABLE courses ALTER COLUMN description TYPE text USING description::text;
ALTER TABLE courses ALTER COLUMN thumbnail_url TYPE text USING NULL;
ALTER TABLE courses ALTER COLUMN settings TYPE text USING NULL;

-- Fix lesson_tests settings
ALTER TABLE lesson_tests ALTER COLUMN settings TYPE text USING NULL;

-- Fix lessons primary key (composite PK was a typo)
ALTER TABLE lessons DROP CONSTRAINT lessons_pkey;
ALTER TABLE lessons ADD PRIMARY KEY (id);

-- Fix role <-> user_role circular FK (remove the bad circular reference)
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_id_user_role_user_id;
ALTER TABLE role DROP CONSTRAINT IF EXISTS fk_role_name_user_role_role_name;
-- Correct direction: user_role references users and role
ALTER TABLE user_role ADD CONSTRAINT fk_user_role_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE user_role ADD CONSTRAINT fk_user_role_role_name FOREIGN KEY (role_name) REFERENCES role(name);
```

---

## Bitmask Permission System

Permissions are stored as a `bigint` bitmask on the `role` table. Each bit represents one capability.

```java
// com.goctrithuc.shared.Permission.java
public final class Permission {
    // Course management
    public static final long CREATE_COURSE       = 1L << 0;  // 1
    public static final long EDIT_OWN_COURSE     = 1L << 1;  // 2
    public static final long PUBLISH_COURSE      = 1L << 2;  // 4
    public static final long DELETE_OWN_COURSE   = 1L << 3;  // 8
    public static final long EDIT_ANY_COURSE     = 1L << 4;  // 16  (admin)
    public static final long DELETE_ANY_COURSE   = 1L << 5;  // 32  (admin)

    // Enrollment
    public static final long ENROLL_COURSE       = 1L << 6;  // 64
    public static final long APPROVE_ENROLLMENT  = 1L << 7;  // 128

    // Content
    public static final long CREATE_LESSON       = 1L << 8;
    public static final long CREATE_QUESTION     = 1L << 9;
    public static final long TAKE_TEST           = 1L << 10;
    public static final long POST_COMMENT        = 1L << 11;
    public static final long DELETE_ANY_COMMENT  = 1L << 12; // admin/moderator

    // User management (admin only)
    public static final long MANAGE_USERS        = 1L << 13;
    public static final long MANAGE_ROLES        = 1L << 14;

    // Helper: check if a role's bitmask includes a permission
    public static boolean has(long roleBitmask, long permission) {
        return (roleBitmask & permission) != 0;
    }
}
```

### Default Role Bitmasks

| Role | Bitmask (binary) | Capabilities |
|------|-----------------|--------------|
| `guest` | `0` | Read-only on public courses (no DB row needed) |
| `student` | `ENROLL + TAKE_TEST + POST_COMMENT` | Enroll, take tests, comment |
| `instructor` | student bits + `CREATE_COURSE + EDIT_OWN_COURSE + PUBLISH_COURSE + DELETE_OWN_COURSE + CREATE_LESSON + CREATE_QUESTION + APPROVE_ENROLLMENT` | Full course ownership |
| `admin` | All bits set | Full platform access |

> **Rule**: When checking permissions in Spring Security, create a `PermissionEvaluator` that loads the user's roles → ANDs their bitmasks → checks the required bit. Use `@PreAuthorize("@permissionEvaluator.has(principal, T(com.goctrithuc.shared.Permission).CREATE_COURSE)")`.

---

## Full Feature List

### 🔐 F1 — Authentication & User Management
- OAuth2 login via Google → creates `users` + `user_providers` rows on first login
- Session-based auth (no JWT); CSRF tokens already wired in frontend
- User profile: `display_name`, `username`, `avatar_url` (Cloudinary URL)
- Unauthenticated users are treated as **guest** — can browse public courses, cannot enroll or comment
- Role assignment: new users get `student` role by default; admins can promote to `instructor`

### 📚 F2 — Course Management
- **Browse**: Public courses visible to all (including guests)
- **Create/Edit/Publish**: Instructors create courses with title, text description, thumbnail (Cloudinary upload), visibility
- **Visibility modes**:
  - `Public` — anyone can enroll immediately
  - `Restricted` — students must request access; course author or admin approves/rejects by deleting the request; student can re-request
  - `Private` — only author and admin can see it
- **Delete**: Instructor can delete own courses; admin can delete any

### 📦 F3 — Modules & Lessons
- Instructors organize courses into ordered **Modules**
- Each module has ordered **Lessons** with 3 types:
  - 📹 **Video**: YouTube or Vimeo embed URL
  - 📝 **Blog**: Rich text / Markdown content
  - 🧪 **Test**: Timed multiple-choice quiz
- Instructors can reorder modules and lessons (update `order` field)
- Lesson resources: attach files (Cloudinary) to any lesson
- Course resources: attach general files to a course

### 📣 F4 — Announcements & Comments
- Instructors post announcements per course (title + content)
- **Announcement comments**: threaded (`parent_id`), posted by enrolled students or instructor, shown below each announcement
- **Lesson comments**: threaded (`parent_id`), shown below each lesson content area
- Admins can delete any comment; users can delete their own comments

### 🧪 F5 — Tests & Question Bank
- Instructors create **questions** (multiple-choice: single or multi-answer, with `correct_choices` as int array)
- Questions belong to an author — reusable across tests
- **Lesson Test**: linked to a lesson, has time limit and settings text
- `test_question` join table controls which questions appear in a test and in what order, with per-question `point` value
- **Test session flow**:
  1. Student clicks "Start Test" → `POST /api/tests/{id}/sessions` → creates `test_sessions` row
  2. Student answers questions → `POST /api/sessions/{sessionId}/answers` (upsert per question)
  3. Student submits → `POST /api/sessions/{sessionId}/submit` → `is_done = true`, score calculated server-side
- Students cannot re-take a completed session (can only have one active session per test)

### 📊 F6 — Progress Tracking
- `lesson_completions`: students mark a lesson complete after viewing
- Student dashboard shows: enrolled courses, % lessons completed per course
- Score stored/derived from `test_session_answers` vs `mc_questions.correct_choices`

### 🗂️ F7 — File Management (Cloudinary)
- All file uploads go to **Cloudinary** via backend (never expose Cloudinary credentials to frontend)
- Backend generates a Cloudinary signed upload URL (or proxies the upload)
- `files` table tracks: author, provider (`cloudinary`), `provider_value` (Cloudinary public_id/URL)
- Files linked to `lesson_resources` or `course_resources`

### 👨‍🏫 F8 — Instructor Dashboard
- List of courses they authored
- Per course: enrolled student count, pending access requests, lesson list, announcements
- Manage questions in their question bank

### 🎓 F9 — Student Dashboard
- Enrolled courses with progress bar
- Continue learning (link to last incomplete lesson)
- Test scores overview

---

## Cross-Team Development Rules

### 🎨 Frontend Rules (UI Consistency)

#### Design System
1. **Component library**: All UI elements must use `shadcn/ui` components. Never write raw `<input>`, `<button>`, `<select>` HTML — always use shadcn equivalents.
2. **Colors**: Use only CSS custom properties from `index.css` (`--background`, `--foreground`, `--primary`, `--muted`, `--destructive`, etc.). **Never hardcode hex or rgb values in JSX/TSX.**
3. **Typography**: Inter Variable font is global. Use Tailwind text utilities (`text-sm`, `text-base`, `text-lg`, `text-xl`, `font-semibold`, `font-bold`). No custom font sizes.
4. **Spacing**: Tailwind spacing scale only (`p-4`, `gap-6`, `mb-8`). Avoid arbitrary values like `p-[13px]`.
5. **Border radius**: Use `rounded`, `rounded-md`, `rounded-lg`, `rounded-xl` only (mapped to `--radius` tokens).
6. **Dark mode**: Every component must support dark mode with `dark:` Tailwind variants. Test both themes before submitting a PR.

#### Component Architecture
7. **Co-location rule**: 
   - Shared/reusable → `src/components/`
   - Page-specific → `src/pages/<page>/_components/`
   - Never put page-specific components in `src/components/`
8. **No inline styles** (`style={{}}`). Tailwind classes only.
9. **Icons**: Only `lucide-react`. Consistent sizes: `size={16}` inline, `size={20}` buttons, `size={24}` standalone.
10. **Loading states**: Every async component shows `<Skeleton>` (shadcn) while fetching. No blank screens.
11. **Error states**: Every async component shows an error message + retry button on failure.
12. **Empty states**: Every list component has a friendly empty state illustration/message.

#### Code Standards
13. **TypeScript strict**: No `any`. All request/response shapes defined in `src/dtos/`. All domain models in `src/entities/`.
14. **API layer**: All HTTP calls go through a singleton Axios instance at `src/lib/api.ts`. Direct `axios.get(...)` calls in components are forbidden.
15. **Routing**: All routes declared in `App.tsx`. Route paths defined as constants in `src/lib/routes.ts`.
16. **Forms**: Use controlled components. Inline validation errors beneath each field. No `alert()`.
17. **Permissions on frontend**: Check permissions client-side for UX only (hide/show UI). The backend is always the source of truth for authorization.
18. **Guest UX**: If a guest tries to enroll or comment, redirect to `/login` with a `?redirect=` param so they land back after login.

---

### ⚙️ Backend Rules (Security & Performance)

#### Package Structure
```
com.goctrithuc/
  auth/           ← OAuth2 flow, session management
  users/          ← User profile, role management
  courses/        ← Course CRUD, enrollment, access requests
  modules/        ← Module CRUD
  lessons/        ← Lesson CRUD, video/blog/test subtypes
  tests/          ← Question bank, test sessions, scoring
  files/          ← Cloudinary upload integration
  announcements/  ← Course announcements + comments
  shared/         ← Permission constants, error handling, pagination DTOs
```

Each package contains: `*Controller.java`, `*Service.java`, `*Repository.java`, `*Entity.java`, `*Dto.java`.

#### Architecture Rules
1. **DTO boundary**: Controllers accept and return only DTOs. `@Entity` classes must never appear in controller method signatures or be serialized to JSON.
2. **Thin controllers**: Controllers do input validation + delegate to service. Zero business logic in controllers.
3. **Service ownership**: Business logic (permission checks, score calculation, state transitions) lives in `@Service` classes only.
4. **Transaction boundary**: `@Transactional` on service methods, not controllers.

#### Security
5. **Endpoint auth matrix**:

| Pattern | Guest | Student | Instructor | Admin |
|---------|-------|---------|------------|-------|
| `GET /api/courses` (public) | ✅ | ✅ | ✅ | ✅ |
| `GET /api/courses/{id}` (public) | ✅ | ✅ | ✅ | ✅ |
| `POST /api/courses/{id}/enroll` | ❌→login | ✅ | ✅ | ✅ |
| `POST /api/courses` | ❌ | ❌ | ✅ | ✅ |
| `PUT /api/courses/{id}` | ❌ | ❌ | ✅ (own) | ✅ |
| `DELETE /api/courses/{id}` | ❌ | ❌ | ✅ (own) | ✅ |
| `GET /api/lessons/{id}` | ❌ | ✅ (enrolled) | ✅ (own course) | ✅ |
| `POST /api/lessons/{id}/comments` | ❌ | ✅ (enrolled) | ✅ | ✅ |
| `POST /api/tests/{id}/sessions` | ❌ | ✅ (enrolled) | ✅ | ✅ |
| `GET /api/admin/**` | ❌ | ❌ | ❌ | ✅ |

6. **Ownership checks**: Before any mutating operation on a resource, verify `currentUser.id == resource.authorId` or user has admin permission. Return `403` if not. Do this in the **service layer**, not controller.
7. **CSRF**: Already enabled and wired. Do **not** disable for any endpoint including file uploads.
8. **Input validation**: All request DTOs annotated with Jakarta Bean Validation. `@Valid` on all controller parameters. Return `400` with field-level errors.
9. **No SQL injection**: JPQL with named parameters or Spring Data method names only. No `EntityManager.createNativeQuery` with string concatenation.
10. **File upload security**: Backend must validate Cloudinary upload by verifying signature. Never trust a `provider_value` URL from the client without server-side verification.
11. **Bitmask permission check**: Use the shared `Permission.has()` helper. Implement a custom `PermissionService` bean that loads the user's role bitmask and provides `boolean hasPermission(User user, long permission)`.

#### Performance
12. **All list endpoints paginated**: Use `Pageable` from Spring Data. Max page size 50. Default page size 20.
13. **N+1 prevention**: Use `@EntityGraph` or `JOIN FETCH` for any association loaded in a list. Run with `spring.jpa.show-sql=true` in dev to catch extra queries.
14. **DB indexes** (add in first migration):
    ```sql
    CREATE INDEX idx_courses_author_id ON courses(author_id);
    CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
    CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
    CREATE INDEX idx_modules_course_id ON modules(course_id);
    CREATE INDEX idx_lessons_module_id ON lessons(module_id);
    CREATE INDEX idx_lesson_comments_lesson_id ON lesson_comments(lesson_id);
    CREATE INDEX idx_announcement_comments_announcement_id ON announcement_comments(announcement_id);
    CREATE INDEX idx_test_sessions_user_test ON test_sessions(user_id, test_id);
    CREATE INDEX idx_announcements_course_id ON announcements(course_id);
    ```
15. **Response compression**: `server.compression.enabled=true` in `application.yml`.

#### API Design Standards
16. **REST conventions**:
    - `GET /api/{resource}` — paginated list
    - `POST /api/{resource}` — create
    - `GET /api/{resource}/{id}` — single item
    - `PUT /api/{resource}/{id}` — full update
    - `PATCH /api/{resource}/{id}` — partial update (e.g., publish toggle)
    - `DELETE /api/{resource}/{id}` — delete
17. **Standard error response**:
    ```json
    {
      "status": 403,
      "message": "You do not have permission to edit this course",
      "errors": {},
      "timestamp": "2026-05-20T10:00:00Z"
    }
    ```
18. **Migration naming** (already in README): `V{yyyyMMddHHmm}_{issueNumber}__{description}.sql`

---

## 2-Week Development Sprint

> **Team**: 1 PM/Tech Lead (Tuấn Anh), 2 Backend, 2 Frontend. 10 working days.
> **Branch strategy**: Feature branches off `main`. PRs require 1 review. CI must pass before merge.

### Week 1 — Foundation & Core Features

| Day | Backend | Frontend |
|-----|---------|----------|
| **Day 1** | Write correction migrations (schema fixes + indexes). Set up package structure. Wire `Permission.java` constants. | Scaffold all route paths in `App.tsx`. Define all DTO types in `src/dtos/`. Create `src/lib/api.ts` Axios instance. Create `src/lib/routes.ts`. |
| **Day 2** | OAuth2 login → session → upsert `users` + `user_providers`. `GET /api/auth/me`. `POST /api/auth/logout`. | Login page: Google OAuth button, redirect handling, loading state. `AuthProvider` wiring for `useAuth()` hook. Guest route guard. |
| **Day 3** | `GET/PATCH /api/users/{id}` (profile). Role seed data migration (`student`, `instructor`, `admin` roles with bitmasks). `PermissionService` bean. | User profile page. Avatar display (Cloudinary URL). Nav bar with auth state (avatar, logout, role-gated links). |
| **Day 4** | `GET /api/courses` (paginated, visibility-filtered). `POST /api/courses`. `GET /api/courses/{id}`. | Course listing page: course cards (thumbnail, title, author, description excerpt), search bar, visibility badge. |
| **Day 5** | `PUT/PATCH/DELETE /api/courses/{id}`. `POST /api/courses/{id}/enroll`. `GET /api/courses/{id}/access-status` (enrolled / requested / none). | Course detail page: header with enroll button (state-aware: enroll / request / enrolled). Enrolled student sees module/lesson sidebar. |

### Week 2 — Content, Tests & Polish

| Day | Backend | Frontend |
|-----|---------|----------|
| **Day 6** | Module CRUD (`GET/POST/PUT/DELETE /api/courses/{id}/modules`). Lesson CRUD with type routing. Reorder endpoint (`PATCH /api/modules/{id}/order`). | Instructor course editor: module accordion, add module/lesson buttons. Drag-to-reorder UI. Lesson type selector. |
| **Day 7** | Video lesson API (save YouTube/Vimeo `provider_value`). Blog lesson API (save markdown text). `POST /api/lessons/{id}/complete`. | Video lesson viewer (YouTube/Vimeo iframe embed). Blog lesson viewer (Markdown renderer — use a lightweight lib). Completion button. |
| **Day 8** | Question bank: `GET/POST/PUT/DELETE /api/questions`. Test CRUD. `POST /api/tests/{id}/questions` (add question to test with order + point). | Test builder UI: question list, add-question form (choices, correct answers, single/multi toggle), point weighting per question. |
| **Day 9** | Test session: `POST /api/tests/{id}/sessions`. `POST/PUT /api/sessions/{id}/answers`. `POST /api/sessions/{id}/submit` (score calculation). `GET /api/sessions/{id}/result`. | Test-taking UI: countdown timer, question navigator, answer selection, submit confirmation. Result screen: score, correct/incorrect breakdown. |
| **Day 10** | Announcements + comments: full CRUD for both `announcement_comments` and `lesson_comments`. `GET /api/courses/{id}/progress` summary. Access request management (`POST/DELETE /api/courses/{id}/access-requests`, `POST /api/access-requests/{id}/approve`). | Comment thread component (reusable, configured for lesson or announcement context). Student dashboard: progress bars per course. Announcement feed. Restricted course access request button. Final bug fixes + polish. |

### Cloudinary Integration (Day 3–4 Backend, Day 5 Frontend)
- Backend exposes `POST /api/files/upload-url` → returns a signed Cloudinary upload URL
- Frontend uploads directly to Cloudinary using that signed URL
- Frontend calls `POST /api/files` with `{ provider: "cloudinary", provider_value: "<public_id>" }` to register the file in DB
- Backend returns the `file.id` which is then linked to a course or lesson resource

### Feature Priority (MoSCoW)

| Priority | Features |
|----------|----------|
| **Must Have** | Auth + roles, Course listing/detail, Enrollment, Video/Blog lessons, Lesson completion, Student dashboard |
| **Should Have** | Tests + sessions + scoring, Announcements + comments, Instructor course editor, Progress tracking |
| **Could Have** | Question bank reuse across tests, File attachments, Restricted course access flow |
| **Won't Have (v1)** | Uploaded video, analytics, certificates, payments, course ratings |

---

## Verification Plan

### Backend
- Unit tests: all `@Service` classes with Mockito (mock repositories)
- Integration tests: all controllers with `@SpringBootTest` + Testcontainers PostgreSQL (already in `pom.xml`)
- Security tests: verify guest requests return `401`, wrong-role requests return `403`, wrong-owner requests return `403`
- Bitmask tests: unit test `Permission.has()` for all defined bits

### Frontend
- MSW (Mock Service Worker) mocks for all API calls during development (already configured in `package.json`)
- Manual smoke test: all user flows in light + dark mode
- Responsive: 375px mobile, 768px tablet, 1280px desktop
- Guest flow: ensure all restricted actions redirect to `/login?redirect=...`

### CI/CD (Already Configured)
- GitHub Actions: Spotless format check (Java) + Prettier check (TS) + build + test on every PR
- CodeQL security scan on push to `main`
- Docker image auto-build + push to GHCR on merge to `main`
