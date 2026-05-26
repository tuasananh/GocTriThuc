# GocTriThuc — Finalized Feature Plan & 2-Week Development Roadmap

**GocTriThuc** ("Corner of Knowledge") is an e-learning platform built with:
- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Backend**: Spring Boot 4 + Java 21 + JPA + PostgreSQL + Flyway
- **Auth**: OAuth2 (Google + GitHub) via Spring Security, session-based with CSRF protection [COMPLETED]

---

## ✅ Resolved Design Decisions

| # | Decision | Resolution |
|---|----------|------------|
| Q1 | `description`, `thumbnail_url`, `settings` column types on `courses` | Fix to **`text`** — were typos using `bigint` |
| Q2 | Permission model | **Bitmask `bigint`** — keep and define concrete bit constants |
| Q3 | File storage provider | **Local Server Storage** (Drop Cloudinary) using persistent Docker Volume. Expose upload/serve endpoints. |
| Q4 | Video provider | **YouTube + Vimeo embed only** for v1; save raw URL and let frontend render directly |
| Q5 | Question types | **`multiple_choice` only** for v1; schema is extensible for the future |
| Q6 | Restricted course access approval | **Separate `course_access_requests` table**. Approval inserts to `enrollments` and deletes request. Rejection deletes request. |
| Q7 | `lessons` PRIMARY KEY | Fix to **`PRIMARY KEY (id)`** — composite PK was a typo |
| Q8 | Comment tables | **Keep separate** — `lesson_comments` and `announcement_comments` both supporting infinite nesting with Reddit-style sub-thread page redirects if depth > 5 |
| Q9 | State Management | **React Context** for Auth (`useAuth`), local component state or URL query params for all other features. Zero boilerplate, zero merge conflicts. |
| Q10| Timed Quiz Sessions | **Server-calculated remaining time** returned from API based on `started_at` and `time_limit`. Cheat-proof and crash-proof. |
| Q11| Question & Lesson Deletion | **Hard-delete** with dynamic score recalculation. Enforces cascade delete on relation tables `test_question` and `test_session_answers`. Past scores dynamically recalculate on-the-fly (deleted questions are excluded from the points pool). |
| Q12| HTML Sanitization | **Backend Jsoup Sanitizer** with a custom BlockNote-extended Safelist to preserve editor CSS styling classes and attributes while removing XSS threats. |
| Q13| Integration & Testing | **Vite Proxy** for local dev, static files placement in backend static folder for prod. Require **1 integration test** (happy path) and **1 security test** per endpoint. |

---

## Bitmask Permission System [COMPLETED]

Permissions are stored as a `bigint` bitmask on the `roles` table. Each bit represents one capability.
Default roles seeded: `admin` (0x7FFFFFFFFFFFFFFF), `teacher` (0x3E), and `student` (0x24).

---

## Full Feature List

### 🔐 F1 — Authentication & User Management [COMPLETED]
- OAuth2 login via Google and GitHub → creates user and provider mapping on first login.
- Session-based auth (no JWT), fully integrated CSRF.
- User profile endpoint `GET /api/users/me` and logout `/api/logout`.

### 📚 F2 — Course Management
- **Browse**: Public courses visible to all.
- **Create/Edit/Publish**: Instructors create courses with title, text description, thumbnail (local upload), and visibility settings.
- **Visibility modes**:
  - `Public` — anyone can enroll immediately.
  - `Restricted` — students request access; requests are saved in `course_access_requests`. Course author or admin approves (moves to `enrollments`) or declines.
  - `Private` — only author and admin can see it.

### 📦 F3 — Modules & Lessons
- Instructors organize courses into ordered **Modules**.
- Each module has ordered **Lessons** sorted using simple Up/Down arrow buttons (no drag-drop) with 3 types:
  - 📹 **Video**: YouTube or Vimeo URL, rendered directly by the frontend.
  - 📝 **Blog**: HTML rich text written and rendered using **BlockNote editor**. Backend sanitizes HTML using `jsoup`.
  - 🧪 **Test**: Timed multiple-choice quiz.

### 📣 F4 — Announcements & Comments
- Instructors post announcements per course.
- **Comments**: Threaded recursively supporting **infinite nesting** (like Reddit). If nesting goes deeper than 5 levels, the UI renders a link redirecting the user to a dedicated view focusing purely on that sub-branch. Enabled beneath lessons and announcements. Deleted parent comments cascade-delete child replies.

### 🧪 F5 — Tests & Question Bank
- Instructors create **questions** (multiple-choice). Deleting a question cascade-deletes its entries in `test_question` and `test_session_answers`.
- **Lesson Test**: linked to a lesson, has a time limit.
- **Test session flow**:
  1. Student starts test → `POST /api/tests/{id}/sessions` (starts countdown, calculated server-side based on `started_at`).
  2. Student answers questions → `PUT /api/sessions/{sessionId}/answers` (autosaves dynamically).
  3. Student submits → `POST /api/sessions/{sessionId}/submit` (sets `is_done = true`, calculates score server-side).

### 📊 F6 — Progress Tracking
- `lesson_completions`: students mark a lesson complete.
- Student dashboard shows: enrolled courses, last incomplete lesson, continue learning link, and progress bars.

### 🗂️ F7 — File Management (Local Storage)
- **Drop Cloudinary**. All uploads go via multipart `POST /api/files/upload` to the backend.
- Files are saved to local persistent storage mapped to a persistent **Docker Volume**.
- Expose `GET /api/files/serve/{id}` to serve assets. File references tracked in `files` table.

### 👨‍🏫 F8 — Instructor Dashboard
- List of courses authored, module outlines, pending access requests list (Approve/Decline), and question bank list.

### 🎓 F9 — Student Dashboard
- Enrolled courses with progress bars, "Continue Learning" CTA, and test scores overview.

### 👑 F10 — Admin Dashboard [NEW]
- User Management: Table displaying all users (`GET /api/admin/users`) with role picker dropdowns to promote/demote roles (`PUT /api/admin/users/{id}/role`).
- Content Moderation: Force-delete inappropriate courses or delete malicious comment threads.

---

## 2-Week Development Roadmap (Remaining Work)

### Week 1 — Foundation & Core Features

| Day | Backend | Frontend |
|-----|---------|----------|
| **Day 1** | **[COMPLETED]** Base directories, security configs, snowflake schema migrations, and role configurations. | **[COMPLETED]** Axios, global layouts, routing skeleton, auth context, and page shells. |
| **Day 2** | **[COMPLETED]** Google/GitHub OAuth integrations, `/api/users/me` profile queries, logout actions. | **[COMPLETED]** LoginPage redirect handles, useAuth hooks, GuestRoute wrappers, and header avatar dropdowns. |
| **Day 3** | Implement local disk multipart upload endpoints: `POST /api/files/upload` and file serving API `GET /api/files/serve/{id}`. Expose `PATCH /api/users/{id}` (profile updates). | Build User Profile page with direct local disk asset upload components (`<AvatarUpload>`). Build dynamic `<RoleBadge>` components. |
| **Day 4** | Implement course endpoints `GET /api/courses` (paginated, visibility-filtered; guests see Public + Restricted) and `POST /api/courses` (restricted to `MANAGE_OWN_COURSES`). | Build Course Listing page with course cards, search bar, and visibility filters. Build `<CreateCourseModal>` modal. |
| **Day 5** | Implement `PUT/PATCH/DELETE /api/courses/{id}`. Implement enrollment endpoints `POST /api/courses/{id}/enroll` and access requests `POST /api/courses/{id}/access-requests`. Expose access check API. | Build Course Detail page with contextual enroll actions ("Enroll", "Request Access", "Pending"). Build course sidebar outline navigation accordions. |

### Week 2 — Content, Tests & Polish

| Day | Backend | Frontend |
|-----|---------|----------|
| **Day 6** | Implement Module CRUD and Lesson CRUD. Implement reorder endpoints `PATCH /api/modules/{id}/order` and `PATCH /api/lessons/{id}/order` (Up/Down arrow commands). | Build Instructor Course Editor curriculum panel. Build simple Up/Down sorting controls with optimistic state triggers. Integrate BlockNote editor for blog creators. |
| **Day 7** | Implement lesson completion toggles `POST /api/lessons/{id}/complete` and resource attachments APIs. Expose course progress summary API. | Build Lesson Viewer workspace. Integrate BlockNote read-only reader and YouTube iframe embeds. Build "Mark as Complete" optimistic checkmarks. |
| **Day 8** | Implement Question CRUD, Test CRUD, and quiz questions linking endpoints. student retrieval hides correct keys. | Build Test Builder panel: linking question banks, point weighting inputs, and `<QuestionForm>` question editors. |
| **Day 9** | Implement timed quiz sessions controllers: session creations (`POST /api/tests/{id}/sessions`), and submissions scoring. Expose remaining time API (server-calculated). | Build Quiz taking panel layout with countdown timer, question navigator, and options select card. Build `<TestResultScreen>` result views. |
| **Day 10** | Implement Announcement CRUD. Implement Reddit-style infinitely nested comment threads (with cascade deletions on parents). Expose Admin promotion APIs. | Build recursive comment drawer with Reddit-style sub-thread redirection if nesting > 5. Build Student, Instructor, and Admin User Dashboards. Final QA check. |

---

## Verification Plan

### Backend
- Spring MVC Integration tests: `@SpringBootTest` + Testcontainers PostgreSQL for all controller endpoints (1 happy path, 1 security check per API).
- HTML Sanitization tests: verify Jsoup strips dangerous scripts from HTML strings.
- Flyway Migration sequencing audits.

### Frontend
- Manual visual tests: verify responsive structures (375px/768px/1280px) and dark mode styling.
- Manual state audits: verify all data grids handle Loading skeleton, Empty state, Error Retry, and Data views correctly.
