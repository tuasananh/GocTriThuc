# GocTriThuc — Team Work Assignment (2 Weeks)

## Team Roster

| Team     | Role            | Member           | Responsibility Area                                                        |
| :------- | :-------------- | :--------------- | :------------------------------------------------------------------------- |
| Backend  | **BE Lead**     | Lê Thành Trung   | Architecture, Security, Auth, Upload engine, Nested comments.              |
| Backend  | **BE Dev (PM)** | Trần Tuấn Anh    | CRUD APIs, Migrations, Admin APIs, SQL QA, PM duties.                      |
| Frontend | **FE Lead**     | Nguyễn Công Vinh | Routing, Layouts, Timed sessions, Reddit comments drawer.                  |
| Frontend | **FE Dev 1**    | Phạm Văn Sâm     | DTOs, Upload UI, Curriculum Up/Down sorting, Video/Blog viewer components. |
| Frontend | **FE Dev 2**    | Vũ Hoàng Tuấn    | Cards, creation modal forms, Dashboards, Admin control tables, Skeletons.  |

---

## Shared Contract: API-First Workflow

Before any frontend starts on a feature, the backend must publish an **API
contract** (URL, request body, response shape, error codes) as a GitHub Issue
comment. The frontend unblocks themselves by writing MSW mocks matching the
contract immediately.

---

## 🏆 Completed Foundation (Days 1–2)

- **Trung (BE Lead)**: Flyway sequence, initial user tables, SecurityConfig
  OAuth2 Google + GitHub configuration, and `/api/users/me` controllers.
- **Anh (BE Dev/PM)**: Roles tables database seeds (`student`, `teacher`,
  `admin`) and global session validations.
- **Vinh (FE Lead)**: Axios configuration, Vite proxy, MainLayout header drop
  navbar, and base routing scripts.
- **Sâm (FE Dev 1)**: DTO types, Loader components, and GuestRoute guards.
- **Tuấn (FE Dev 2)**: LoginPage forms, Dashboard pages, and global styling
  tokens.

---

## 📅 Remaining Roadmap (Days 3–10)

---

### Day 3 — User Profiles & Local Disk File Uploads

| Member                | Tasks                                                                                                                                                                                                            |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trung (BE Lead)**   | Implement profile updates `PATCH /api/users/{id}` (validate username uniqueness). Expose local multipart upload controller `POST /api/files/upload` saving to `UPLOAD_DIR`. Save file reference in the database. |
| **Anh (BE Dev / PM)** | Expose file serving endpoint `GET /api/files/serve/{id}`. Stream local disk files with correct MIME types. Write profile integration tests and Jakarta validations.                                              |
| **Vinh (FE Lead)**    | Build User Profile page interface: display name updates and settings form. Coordinate direct multipart file upload API helpers.                                                                                  |
| **Sâm (FE Dev 1)**    | Build `<AvatarUpload>` drag-and-drop file upload component displaying live progress indicators and previews.                                                                                                     |
| **Tuấn (FE Dev 2)**   | Build dynamic `<RoleBadge>` component (highlighting Student, Teacher, Admin). Build `usePermission(bit)` client permission hooks.                                                                                |

---

### Day 4 — Course Search & Creation

| Member                | Tasks                                                                                                                                                                                                                                                                                         |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trung (BE Lead)**   | Implement search/listing `GET /api/courses` (paginated, visibility-filtered based on role: Guest = Public + Restricted, Student = Public + Restricted, Teacher/Admin = All including Private). Implement course creation `POST /api/courses` (restricted to `MANAGE_OWN_COURSES` permission). |
| **Anh (BE Dev / PM)** | Implement course detail `GET /api/courses/{id}` (prevent guests/unauthorized users from viewing Private courses). Write `@EntityGraph` joint queries to prevent N+1 queries.                                                                                                                  |
| **Vinh (FE Lead)**    | Build Course Search catalog layout. Build dynamic grid view rendering lists of courses.                                                                                                                                                                                                       |
| **Sâm (FE Dev 1)**    | Build debounced search filters and visibility tabs (`All / Public / Restricted`). Write MSW mock courses handlers.                                                                                                                                                                            |
| **Tuấn (FE Dev 2)**   | Build `<CreateCourseModal>` accessible only to authors, with inputs for title, description, visibility, and thumbnail uploads.                                                                                                                                                                |

---

### Day 5 — Course Details & Classroom Enrollment

| Member                | Tasks                                                                                                                                                                                                                                     |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------- |
| **Trung (BE Lead)**   | Implement `PUT/PATCH/DELETE /api/courses/{id}` (enforce service-layer author ownership checks). Implement enrollments `POST /api/courses/{id}/enroll` (public) and access requests `POST /api/courses/{id}/access-requests` (restricted). |
| **Anh (BE Dev / PM)** | Create separate `course_access_requests` table (Flyway migration). Expose `GET /api/courses/{id}/access-status` returning relationship `{ status: "none"                                                                                  | "requested" | "enrolled" }`. |
| **Vinh (FE Lead)**    | Build Course Detail view: headers, descriptions, and contextual CTA buttons ("Enroll Now", "Request Access", "Pending Approval", "Go to Classroom").                                                                                      |
| **Sâm (FE Dev 1)**    | Build expandable `<ModuleSidebar>` outline accordion visible only to enrolled students/instructors showing lessons with type icons.                                                                                                       |
| **Tuấn (FE Dev 2)**   | Build `<RestrictedAccessBanner>` shown to non-enrolled users visiting restricted course outlines. Build `<CourseEditModal>` modal.                                                                                                        |

---

### Day 6 — Course Curriculum Editor

| Member                | Tasks                                                                                                                                                                                    |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trung (BE Lead)**   | Implement Module CRUD (`POST/PUT/DELETE /api/courses/{id}/modules`) and Lesson CRUD (`POST/PUT/DELETE /api/modules/{id}/lessons`).                                                       |
| **Anh (BE Dev / PM)** | Implement reorder endpoints `PATCH /api/modules/{id}/order` and `PATCH /api/lessons/{id}/order` accepting Up/Down arrow commands, validating bounds, and updating sequence index values. |
| **Vinh (FE Lead)**    | Build Instructor Course Editor pane: modules accordions with quick actions ("Add Module", "Add Lesson", "Delete Module").                                                                |
| **Sâm (FE Dev 1)**    | Build simple Up/Down arrow sorting controls on curriculum list cards. Trigger optimistic UI updates immediately, with rollback backups on network failure.                               |
| **Tuấn (FE Dev 2)**   | Build `<VideoLessonForm>` supporting raw YouTube/Vimeo URLs. Integrate `BlockNote` editor inside `<BlogLessonForm>` blog rich text editor.                                               |

---

### Day 7 — Lesson Player & Completion Tracking

| Member                | Tasks                                                                                                                                                                          |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trung (BE Lead)**   | Implement completion toggle `POST /api/lessons/{id}/complete` for students. Expose course progress status summaries API.                                                       |
| **Anh (BE Dev / PM)** | Implement file resource attachments to lessons and courses: exposing upload and download listing endpoints.                                                                    |
| **Vinh (FE Lead)**    | Build double-column Classroom Viewer: main pane renders players, sidebar displays outlines. Integrate BlockNote editor in read-only mode inside `<BlogLessonViewer>` renderer. |
| **Sâm (FE Dev 1)**    | Build "Previous" and "Next" lesson navigation buttons beneath each lesson page (smoothly crossing module limits).                                                              |
| **Tuấn (FE Dev 2)**   | Build optimistic "Mark as Complete" checkmark button triggers. Build progress indicators and `<LessonResourceList>` resource sheets.                                           |

---

### Day 8 — Question Bank & Test Builder

| Member                | Tasks                                                                                                                                                                    |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trung (BE Lead)**   | Implement Question CRUD and Test CRUD. Expose `POST /api/tests/{id}/questions` to link questions to quizzes with order and points variables.                             |
| **Anh (BE Dev / PM)** | Expose quiz retrieval `GET /api/tests/{id}/questions` which strictly **hides** the `correct_choices` property if the requester is a student to prevent cheat injections. |
| **Vinh (FE Lead)**    | Build Test Builder panel: instructors search and link question bank questions to quizzes, adjusting point weights.                                                       |
| **Sâm (FE Dev 1)**    | Build `<QuestionForm>` supporting options array, correct choice key tags, and single/multi-choice toggles.                                                               |
| **Tuấn (FE Dev 2)**   | Build `<TestSettingsForm>` containing quiz duration limits. Build instructor question bank search grids.                                                                 |

---

### Day 9 — Timed Quiz Session & Scoring Engine

| Member                | Tasks                                                                                                                                                                                                                                        |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trung (BE Lead)**   | Implement quiz sessions creation `POST /api/tests/{id}/sessions` (started_at logged). Implement submissions scoring `POST /api/sessions/{id}/submit`. Enforce cascade deleting of questions from `test_question` and `test_session_answers`. |
| **Anh (BE Dev / PM)** | Expose autosave endpoint `PUT /api/sessions/{id}/answers`. Calculate quiz remaining time on backend: `started_at + time_limit - current_time` to prevent client-side timer manipulation.                                                     |
| **Vinh (FE Lead)**    | Build timed Quiz taking interface: active countdown timer submitted automatically on zero, left-hand questions navigator sidebar, and active question sheet.                                                                                 |
| **Sâm (FE Dev 1)**    | Build `<MultipleChoiceQuestion>` rendering options as radio groups (single) or checklists (multi), triggering autosaves on option select changes.                                                                                            |
| **Tuấn (FE Dev 2)**   | Build `<TestResultScreen>` result views: final score, duration, and question-by-question review grids. Block retakes on completed sessions.                                                                                                  |

---

### Day 10 — Reddit Comments, Dashboards, Admin UI & Polish

| Member                | Tasks                                                                                                                                                                                                 |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trung (BE Lead)**   | Implement Announcement CRUD. Implement Reddit-style infinitely nested comment threads (for lessons and announcements) using `parent_id` recursive models. Expose access requests approvals endpoints. |
| **Anh (BE Dev / PM)** | Expose Admin user management APIs: `GET /api/admin/users` and role updates `PUT /api/admin/users/{id}/role`. Conduct JPA query SQL audits to remove any N+1 loops.                                    |
| **Vinh (FE Lead)**    | Build recursive comment thread drawer with Reddit-style sub-thread redirect links if comments nest deeper than 5 levels.                                                                              |
| **Sâm (FE Dev 1)**    | Build announcements listing feed and instructor announcements creation creator interfaces.                                                                                                            |
| **Tuấn (FE Dev 2)**   | Build Student Dashboard progress overview, Instructor authored list table, and Admin User management grids (with roles promotions).                                                                   |

---

## 🛠️ Definition of Done

### Backend

- [ ] Controller endpoints return correct REST status codes.
- [ ] Jakarta parameter validation tags present on all input DTOs.
- [ ] Service-layer author/admin security mapping checks done.
- [ ] Happy path and unauthorized access integration tests completed.
- [ ] No N+1 queries seen in logs.
- [ ] HTML outputs sanitized via jsoup helper.

### Frontend

- [ ] Visual audit completed: styled cleanly in light + dark modes.
- [ ] Skeletons loading states present during data fetches.
- [ ] Dynamic empty states with CTA actions integrated.
- [ ] Warning retry error panels handled.
- [ ] Desktop, tablet, and mobile views fully responsive.
- [ ] ESLint and Prettier formatting checks passed.
