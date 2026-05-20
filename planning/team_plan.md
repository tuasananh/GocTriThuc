# GocTriThuc — Team Work Assignment (2 Weeks)

## Team Roster

| Team | Role | Member | Responsibility Area |
|------|------|--------|---------------------|
| Backend | **BE Lead** | Lê Thành Trung | Architecture, Security, Auth, Tests |
| Backend | **BE Dev (PM)** | Trần Tuấn Anh | CRUD APIs, Migrations, File Integration, PM duties |
| Frontend | **FE Lead** | Nguyễn Công Vinh | Design System, Routing, Complex UI |
| Frontend | **FE Dev 1** | Phạm Văn Sâm | Course/Lesson/Enrollment UI |
| Frontend | **FE Dev 2** | Vũ Hoàng Tuấn | Tests, Dashboard, Comments UI |

> **PM note**: Tuấn Anh codes backend full-time AND manages GitHub Issues/PRs. Trung (BE Lead) makes final architecture calls. Vinh (FE Lead / Tech Lead) is the final word on frontend patterns.

---

## Shared Contract: API-First Workflow

Before any frontend starts on a feature, the backend must publish an **API contract** (URL, request body, response shape, error codes) as a GitHub Issue comment or a shared doc.

**Frontend unblocks themselves** by writing MSW mocks matching the contract immediately — they never wait for the real API to be deployed.

```
Backend writes API contract → FE writes MSW mock → FE builds UI → BE finishes real API → FE swaps mock for real call → integration test
```

---

## Week 1 — Foundation & Core

### Day 1 — Project Setup & Schema

| Member | Tasks |
|--------|-------|
| **Trung (BE Lead)** | Write Flyway correction migration (schema fixes, indexes). Set up package structure (`auth/`, `courses/`, `lessons/`, `tests/`, `files/`, `shared/`). Create `Permission.java` constants. Wire Spring Security config skeleton. |
| **Anh (BE Dev / PM)** | Set up `application.yml` (HikariCP, compression, JPA show-sql in dev). Write seed migration for default roles with bitmasks. Create base `ApiErrorResponse` record and `GlobalExceptionHandler`. |
| **Vinh (FE Lead)** | Create `src/lib/api.ts` (Axios singleton). Create `src/lib/routes.ts` (all path constants). Scaffold all route shells in `App.tsx`. Set up MSW for dev. |
| **Sâm (FE Dev 1)** | Define all DTO TypeScript interfaces in `src/dtos/` (User, Course, Module, Lesson, Enrollment). Create reusable `<PageShell>` and `<SectionHeader>` components. |
| **Tuấn (FE Dev 2)** | Define DTO types for Tests, Questions, Sessions, Comments. Create `<Skeleton>` wrapper variants and `<EmptyState>` component used across all lists. |

---

### Day 2 — Authentication

| Member | Tasks |
|--------|-------|
| **Trung (BE Lead)** | Implement OAuth2 login → `UserService.upsertFromOAuth()` (create/update `users` + `user_providers`). Implement `GET /api/auth/me` and `POST /api/auth/logout`. Write integration tests for auth endpoints. |
| **Anh (BE Dev / PM)** | Implement `PermissionService.hasPermission(user, bit)`. Wire `@PreAuthorize` on a sample endpoint to validate the bitmask flow end-to-end. Write unit tests for `Permission.has()`. |
| **Vinh (FE Lead)** | Build Login page: Google OAuth button, loading spinner, error toast. Implement redirect-after-login (`?redirect=` param handling). Wire `AuthProvider` to call `GET /api/auth/me` on mount. |
| **Sâm (FE Dev 1)** | Build `GuestRoute` and `ProtectedRoute` guards. Build `useAuth()` hook exposing `{ user, isLoading, isAuthenticated }`. Write MSW handlers for `GET /api/auth/me` (both authenticated and 401 states). |
| **Tuấn (FE Dev 2)** | Build the top `<Navbar>` component: logo, nav links (role-gated), avatar dropdown (profile, logout). Dark/light mode toggle button wired to `localStorage`. |

---

### Day 3 — User Profile & Role Infrastructure

| Member | Tasks |
|--------|-------|
| **Trung (BE Lead)** | Implement `GET /api/users/{id}` and `PATCH /api/users/{id}` (display_name, username validation for uniqueness). Implement Cloudinary signed-URL endpoint `POST /api/files/upload-url`. |
| **Anh (BE Dev / PM)** | Implement `POST /api/files` (register uploaded file in DB). Add Jakarta validation on all request DTOs created so far. Write integration tests for user profile endpoints. |
| **Vinh (FE Lead)** | Build User Profile page: avatar (Cloudinary URL), display_name, username fields. Implement Cloudinary direct upload flow (get signed URL → upload → register file). |
| **Sâm (FE Dev 1)** | Write MSW handlers for user profile endpoints. Build `<AvatarUpload>` component (drag-and-drop, progress bar). |
| **Tuấn (FE Dev 2)** | Build `<RoleBadge>` component. Build `<UserCard>` for use in instructor/student lists. Write `usePermission(bit)` hook that reads bitmask from `useAuth()`. |

---

### Day 4 — Course Listing & Creation

| Member | Tasks |
|--------|-------|
| **Trung (BE Lead)** | Implement `GET /api/courses` (paginated, filter by visibility for current user/guest). Implement `POST /api/courses` with `@PreAuthorize` for `CREATE_COURSE`. Publish API contract for frontend. |
| **Anh (BE Dev / PM)** | Implement `GET /api/courses/{id}` (include author info, visibility-gated). Write N+1 check using `@EntityGraph`. Add `idx_courses_author_id` and other indexes in migration. |
| **Vinh (FE Lead)** | Build Course Listing page: `<CourseCard>` (thumbnail, title, author avatar, visibility badge), pagination controls, skeleton loading grid. |
| **Sâm (FE Dev 1)** | Build course search bar with debounced input. Build visibility filter tabs (`All / Public / Restricted`). Write MSW handlers for course list and detail. |
| **Tuấn (FE Dev 2)** | Build `<CreateCourseModal>` (title, description, visibility selector, thumbnail upload). Wire to `POST /api/courses`. Guard button behind `usePermission(CREATE_COURSE)`. |

---

### Day 5 — Course Detail & Enrollment

| Member | Tasks |
|--------|-------|
| **Trung (BE Lead)** | Implement `PUT/PATCH/DELETE /api/courses/{id}` with ownership checks. Implement `POST /api/courses/{id}/enroll` (public) and `POST /api/courses/{id}/access-requests` (restricted). |
| **Anh (BE Dev / PM)** | Implement `GET /api/courses/{id}/access-status` → returns `{ status: "none" | "requested" | "enrolled" }`. Implement `GET /api/courses/{id}/modules` (list with lessons). |
| **Vinh (FE Lead)** | Build Course Detail page header: thumbnail banner, title, author, description, enroll button (state-aware: Enroll / Request Access / Enrolled / Pending). |
| **Sâm (FE Dev 1)** | Build module sidebar/accordion for enrolled users. Lesson list items with type icon (video/blog/test) and completion checkmark. MSW for enrollment and access-status. |
| **Tuấn (FE Dev 2)** | Build `<RestrictedAccessBanner>` for non-enrolled restricted courses. Guest enroll → redirect to login. Build `<CourseEditModal>` for instructors. |

---

## Week 2 — Content, Tests & Polish

### Day 6 — Modules & Lesson Editor

| Member | Tasks |
|--------|-------|
| **Trung (BE Lead)** | Implement Module CRUD (`POST/PUT/DELETE/PATCH-order /api/courses/{id}/modules`). Implement Lesson CRUD (`POST/PUT/DELETE /api/modules/{id}/lessons`) with type branching. |
| **Anh (BE Dev / PM)** | Implement reorder endpoint (`PATCH /api/lessons/{id}/order`). Implement `GET /api/lessons/{id}` with content (video URL or blog text). Write integration tests for module/lesson CRUD. |
| **Vinh (FE Lead)** | Build Instructor Course Editor page: module accordion with add/delete buttons. Lesson list per module with type badge. `<LessonTypeSelector>` modal. |
| **Sâm (FE Dev 1)** | Build drag-to-reorder for modules and lessons (use `@dnd-kit/core` or native HTML5 drag). Optimistic UI update on reorder. |
| **Tuấn (FE Dev 2)** | Build `<VideoLessonForm>` (YouTube/Vimeo URL input with embed preview). Build `<BlogLessonForm>` (Markdown textarea + live preview). |

---

### Day 7 — Lesson Viewer & Completion

| Member | Tasks |
|--------|-------|
| **Trung (BE Lead)** | Implement `POST /api/lessons/{id}/complete` (upsert `lesson_completions`). Implement `GET /api/courses/{id}/progress` → `{ completedLessons, totalLessons, percent }`. |
| **Anh (BE Dev / PM)** | Implement lesson resources: `POST /api/lessons/{id}/resources` (attach file), `GET /api/lessons/{id}/resources`. Course resources equivalent. Write tests. |
| **Vinh (FE Lead)** | Build `<VideoLessonViewer>` (YouTube/Vimeo iframe embed, responsive 16:9). Build `<BlogLessonViewer>` (rendered Markdown with syntax highlighting). |
| **Sâm (FE Dev 1)** | Build lesson navigation: previous/next lesson buttons with module boundary handling. Lesson sidebar progress indicators (checkmarks). |
| **Tuấn (FE Dev 2)** | Build "Mark as Complete" button with optimistic UI. Build `<ProgressBar>` component. Build `<LessonResourceList>` (download links for attachments). |

---

### Day 8 — Question Bank & Test Builder

| Member | Tasks |
|--------|-------|
| **Trung (BE Lead)** | Implement Question CRUD (`GET/POST/PUT/DELETE /api/questions`). Implement Test CRUD (linked to lesson). Implement `POST /api/tests/{id}/questions` (add question to test with order + point). |
| **Anh (BE Dev / PM)** | Implement `GET /api/tests/{id}/questions` (ordered question list, **without** revealing `correct_choices` to students). Write unit tests for score calculation logic. |
| **Vinh (FE Lead)** | Build Test Builder UI: question list with `point` field, add/remove questions, reorder. `<QuestionPicker>` modal (search question bank). |
| **Sâm (FE Dev 1)** | Build `<QuestionForm>` (statement, choices array, correct answer selection, single/multi toggle). Wire to `POST /api/questions`. |
| **Tuấn (FE Dev 2)** | Build `<TestSettingsForm>` (time limit, linked lesson). Build instructor question bank page with search/filter. MSW handlers for all question/test endpoints. |

---

### Day 9 — Test Sessions & Scoring

| Member | Tasks |
|--------|-------|
| **Trung (BE Lead)** | Implement `POST /api/tests/{id}/sessions` (create session, enforce one active session per test). `POST /api/sessions/{id}/submit` (set `is_done=true`, calculate score by comparing answers to `correct_choices`). `GET /api/sessions/{id}/result`. |
| **Anh (BE Dev / PM)** | Implement `PUT /api/sessions/{id}/answers` (upsert answer for a question). Validate session ownership and `is_done=false` before accepting answers. Write integration tests for full test session lifecycle. |
| **Vinh (FE Lead)** | Build `<TestViewer>` layout: question navigator sidebar, question display area, submit button. Integrate countdown timer (decrement from `time_limit`, auto-submit on zero). |
| **Sâm (FE Dev 1)** | Build `<MultipleChoiceQuestion>` (renders choices, handles single/multi selection). Persist selected answers to backend on every selection change. |
| **Tuấn (FE Dev 2)** | Build `<TestResultScreen>`: score display, per-question correct/incorrect breakdown, "Review answers" view. Handle already-completed session state (show result instead of test). |

---

### Day 10 — Announcements, Comments, Dashboard & Polish

| Member | Tasks |
|--------|-------|
| **Trung (BE Lead)** | Implement Announcement CRUD. Implement `lesson_comments` CRUD (threaded, `parent_id`). Implement `announcement_comments` CRUD. Implement access request approval: `POST /api/access-requests/{id}/approve`, `DELETE /api/access-requests/{id}`. |
| **Anh (BE Dev / PM)** | Final integration tests pass. Fix any broken tests from schema changes. Review all endpoints with `spring.jpa.show-sql=true` — resolve any N+1 queries found. Run Spotless check. |
| **Vinh (FE Lead)** | Build reusable `<CommentThread>` component (configurable for lesson or announcement context). Supports nested replies, delete own comment. Final dark mode audit across all pages. |
| **Sâm (FE Dev 1)** | Build Announcement feed page per course (instructor post, student read + comment). Build `<AnnouncementCard>` with comment count badge. |
| **Tuấn (FE Dev 2)** | Build Student Dashboard: enrolled course cards with progress bars, "Continue Learning" CTA. Build Instructor Dashboard: course list, pending access requests table with Approve/Decline buttons. Run Prettier + ESLint check on entire frontend. |
| **Anh (BE Dev / PM)** | Full integration QA run: test all user flows end-to-end (guest → login → enroll → watch lesson → take test → comment). File bugs as GitHub Issues. Final deployment smoke test on Docker prod image. |

---

## GitHub Workflow Rules

```
main
 └── feature/<issue-number>-<short-description>
      e.g. feature/12-course-enrollment-api
           feature/15-video-lesson-viewer
```

1. **One issue = one PR**. No "mega PRs" mixing multiple features.
2. **PR must pass CI** (format check + build + tests) before review.
3. **PR requires 1 approval**: Vinh reviews backend PRs; Tuấn reviews frontend PRs; Tuấn Anh reviews cross-cutting PRs.
4. **API contracts published as GitHub Issue comments** before frontend starts on that feature.
5. **MSW mock merged first**, then real API integration in a follow-up PR.

---

## Definition of Done (per ticket)

### Backend
- [ ] Endpoint implemented and returns correct HTTP status codes
- [ ] Jakarta validation on request DTO
- [ ] Ownership / permission check present
- [ ] At least one integration test using Testcontainers
- [ ] `spring.jpa.show-sql` shows no unexpected extra queries
- [ ] Spotless format check passes

### Frontend
- [ ] Component works in both **light and dark mode**
- [ ] Loading skeleton shown during fetch
- [ ] Error state handled with message + retry
- [ ] Empty state handled
- [ ] MSW mock exists for all API calls
- [ ] Responsive at 375px / 768px / 1280px
- [ ] Prettier + ESLint passes

---

## Critical Path & Dependencies

```
Day 1: Schema + Setup (unblocks everything)
  └── Day 2: Auth API (BE) + Login UI (FE) — unblocks all protected features
        └── Day 3: Profile + Cloudinary — unblocks file attachments
        └── Day 4: Course CRUD — unblocks Day 5, 6, 7, 8
              └── Day 5: Enrollment — unblocks lesson access
                    └── Day 6: Modules/Lessons editor
                          └── Day 7: Lesson viewer + completion
                          └── Day 8: Test builder
                                └── Day 9: Test session + scoring
              └── Day 10: Announcements + Dashboard (parallel to Day 8–9)
```

> **Risk**: If auth (Day 2) is delayed, frontend Day 3–5 must rely entirely on MSW mocks — this is acceptable and planned for.
