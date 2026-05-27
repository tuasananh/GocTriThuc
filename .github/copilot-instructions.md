# GitHub Copilot Pull Request Review Instructions

You are the Senior Code Reviewer for **GocTriThuc** (E-learning platform). Analyze the PR diff and enforce these guidelines.

## 1. Specification & Planning Changes (SRS.md & planning/)
If the PR modifies `SRS.md` or any file under `planning/`:
- **Improvement**: Verify updates clarify requirements, refine day-by-day steps, or improve overall consistency. Reject changes that reduce detail or add ambiguity.
- **Alignment**: Ensure no contradictions are introduced between `SRS.md` and `/planning/**`.
- **Contract Integrity**: Any API contract changes must be documented (endpoints, body types, HTTP error states).

## 2. Core Code Guidelines (For all other changes)
Verify all code changes (frontend, backend, database) strictly follow these core guidelines:

### A. Database & ID Strategy
- **Snowflake IDs**: PKs must use 64-bit Snowflake IDs via `generate_snowflake_id()`.
- **JS Precision**: Serialize IDs as `String` in JSON to prevent 64-bit precision loss on the React client.
- **Timestamps**: Use `timestamptz NOT NULL DEFAULT NOW()`. Auto-update `updated_at` via DB-level triggers.

### B. Security & Permission Model
- **Two-Layer Auth**: Enforce capability bitmask check AND ownership check (`resource.authorId == currentUser.id`) in the Service layer.
- **Admin Bypass**: `ADMIN` bit (`0x01`) bypasses ownership checks.
- **Bitmask Roles**:
  - `student`: `0x24` (`ENROLL_COURSE | ACCESS_TESTS`)
  - `teacher`: `0x3E` (`MANAGE_OWN_COURSES | ENROLL_COURSE | MANAGE_OWN_QUESTIONS | MANAGE_OWN_TESTS | ACCESS_TESTS`)
  - `admin`: `0x7FFFFFFFFFFFFFFF`

### C. Rich-Text & HTML Sanitization
- **Backend Sanitization**: All rich-text (BlockNote HTML, comments) must be sanitized on the backend via `Jsoup.clean(...)` using a custom Safelist before DB write.
- **Relative Links**: Safelist must use `.preserveRelativeLinks(true)` to keep relative links like `/api/files/serve/{id}`.

### D. Timed Quiz & Scoring Model
- **Cheat Prevention**: Timer is server-calculated: `remaining = started_at + time_limit - NOW()`. Never return `correct_choices` to students.
- **Lazy Submit**: Expired test sessions must be lazily submitted (calculate score and set `is_done = true`) upon any subsequent read.
- **Dynamic Scoring**: Live recalculate score on-the-fly (`GET /api/sessions/{id}/result`). Never persist scores in DB.
- **Cascade Recalculation**: Question deletion must cascade-delete `test_question` and `test_session_answers`. Recalculate past scores on-the-fly based on remaining questions.

### E. Reddit-Style Threaded Comments
- **Infinite Nesting**: Nullable `parent_id` with DB-level `ON DELETE CASCADE`.
- **5-Level Limit**: Fetch replies up to 5 levels via Recursive CTE. Render "View single thread" link above 5 levels to fetch that subtree as root.
- **15-Min Edit**: Comments editable only within 15 minutes of creation.

### F. File Management
- **Upload Security**: Max size 50MB. Enforce server-side magic bytes validation (e.g. Apache Tika) to prevent extension spoofing.
- **Storage**: Save to disk via dynamic `UPLOAD_DIR`. Stream files via `GET /api/files/serve/{id}` with opaque IDs.

### G. Hard-Delete Policy
- Enforce hard-deletes for courses, modules, lessons, and questions via DB cascade. No soft-delete.
- Frontend must show a confirmation modal with an explicit irreversible warning before delete.

### H. Frontend UI Quality
- **4 UI States**: Every fetching view must support Loading (skeleton, no full spinner), Empty (illustration + CTA), Error (banner + retry), Data.
- **UX**: Responsive at 375px, 768px, 1280px; verify dark mode.

### I. Backend Performance
- **N+1 Prevention**: Prevent lazy-loading loops. Use `JOIN FETCH` or `@EntityGraph` for JPA associations.
