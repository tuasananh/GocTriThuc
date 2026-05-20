# Day 1 — Project Setup & Schema Foundation

**Goal**: Runnable environment + codebase skeleton. No feature logic yet.
**Done when**: `./mvnw spring-boot:run` applies all migrations cleanly; `pnpm dev` serves the app; MSW starts in browser console.

---

## 🔴 Trung (BE Lead)

### Task 1 — Schema correction migration
File: `backend/src/main/resources/db/migration/V202605200001_1__fix_schema_and_indexes.sql`

```sql
-- Fix bigint typos on courses
ALTER TABLE courses
  ALTER COLUMN description TYPE text USING NULL,
  ALTER COLUMN thumbnail_url TYPE text USING NULL,
  ALTER COLUMN settings TYPE text USING NULL;

ALTER TABLE lesson_tests ALTER COLUMN settings TYPE text USING NULL;

-- Fix composite PK on lessons
ALTER TABLE lessons DROP CONSTRAINT lessons_pkey;
ALTER TABLE lessons ADD PRIMARY KEY (id);

-- Fix circular FK
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_id_user_role_user_id;
ALTER TABLE role  DROP CONSTRAINT IF EXISTS fk_role_name_user_role_role_name;
ALTER TABLE user_role ADD CONSTRAINT fk_user_role_user_id
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_role ADD CONSTRAINT fk_user_role_role_name
  FOREIGN KEY (role_name) REFERENCES role(name) ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_courses_author_id       ON courses(author_id);
CREATE INDEX idx_courses_visibility      ON courses(visibility);
CREATE INDEX idx_enrollments_user_id     ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id   ON enrollments(course_id);
CREATE INDEX idx_modules_course_id       ON modules(course_id);
CREATE INDEX idx_lessons_module_id       ON lessons(module_id);
CREATE INDEX idx_lesson_comments_lesson  ON lesson_comments(lesson_id);
CREATE INDEX idx_ann_comments_ann_id     ON announcement_comments(announcement_id);
CREATE INDEX idx_test_sessions_user_test ON test_sessions(user_id, test_id);
CREATE INDEX idx_announcements_course    ON announcements(course_id);
```

### Task 2 — Create package skeleton

Create empty `package-info.java` in each package so the directory structure is committed:
```
com.goctrithuc.auth
com.goctrithuc.courses
com.goctrithuc.modules
com.goctrithuc.lessons
com.goctrithuc.tests
com.goctrithuc.files
com.goctrithuc.announcements
com.goctrithuc.users
com.goctrithuc.shared
```

### Task 3 — `Permission.java`
File: `com/goctrithuc/shared/Permission.java`

```java
package com.goctrithuc.shared;

public final class Permission {
  private Permission() {}

  public static final long CREATE_COURSE      = 1L << 0;  // 1
  public static final long EDIT_OWN_COURSE    = 1L << 1;  // 2
  public static final long PUBLISH_COURSE     = 1L << 2;  // 4
  public static final long DELETE_OWN_COURSE  = 1L << 3;  // 8
  public static final long EDIT_ANY_COURSE    = 1L << 4;  // 16
  public static final long DELETE_ANY_COURSE  = 1L << 5;  // 32
  public static final long ENROLL_COURSE      = 1L << 6;  // 64
  public static final long APPROVE_ENROLLMENT = 1L << 7;  // 128
  public static final long CREATE_LESSON      = 1L << 8;  // 256
  public static final long CREATE_QUESTION    = 1L << 9;  // 512
  public static final long TAKE_TEST          = 1L << 10; // 1024
  public static final long POST_COMMENT       = 1L << 11; // 2048
  public static final long DELETE_ANY_COMMENT = 1L << 12; // 4096
  public static final long MANAGE_USERS       = 1L << 13; // 8192
  public static final long MANAGE_ROLES       = 1L << 14; // 16384

  // Presets
  // student = 64 + 1024 + 2048 = 3136
  public static final long STUDENT_PERMISSIONS =
      ENROLL_COURSE | TAKE_TEST | POST_COMMENT;

  // instructor = 3136 + 1+2+4+8+128+256+512 = 4051
  public static final long INSTRUCTOR_PERMISSIONS =
      STUDENT_PERMISSIONS | CREATE_COURSE | EDIT_OWN_COURSE | PUBLISH_COURSE
      | DELETE_OWN_COURSE | CREATE_LESSON | CREATE_QUESTION | APPROVE_ENROLLMENT;

  public static final long ADMIN_PERMISSIONS = ~0L;

  public static boolean has(long bitmask, long permission) {
    return (bitmask & permission) != 0;
  }
}
```

### Task 4 — Spring Security skeleton
File: `com/goctrithuc/auth/SecurityConfig.java`

```java
package com.goctrithuc.auth;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/auth/**").permitAll()
        .requestMatchers(
          org.springframework.http.HttpMethod.GET, "/api/courses", "/api/courses/*"
        ).permitAll()
        .anyRequest().authenticated()
      )
      .csrf(csrf -> csrf
        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
      )
      .oauth2Login(oauth2 -> oauth2
        .defaultSuccessUrl("/api/auth/me", false)
      );
    return http.build();
  }
}
```

---

## 🔴 Anh (BE Dev / PM)

### Task 1 — Role seed migration
File: `backend/src/main/resources/db/migration/V202605200002_1__seed_roles.sql`

```sql
INSERT INTO role (name, permissions, description, created_at, updated_at)
VALUES
  ('student',    3136,  'Default learner role',      NOW(), NOW()),
  ('instructor', 4051,  'Can create/manage courses', NOW(), NOW()),
  ('admin',      -1,    'Full platform access',      NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
```

### Task 2 — `ApiErrorResponse.java`
File: `com/goctrithuc/shared/ApiErrorResponse.java`

```java
package com.goctrithuc.shared;

import java.time.Instant;
import java.util.Map;

public record ApiErrorResponse(
    int status,
    String message,
    Map<String, String> errors,
    Instant timestamp) {}
```

### Task 3 — `GlobalExceptionHandler.java`
File: `com/goctrithuc/shared/GlobalExceptionHandler.java`

```java
package com.goctrithuc.shared;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiErrorResponse> handleValidation(
      MethodArgumentNotValidException ex) {
    Map<String, String> errors = new HashMap<>();
    ex.getBindingResult().getAllErrors().forEach(err -> {
      String field = ((FieldError) err).getField();
      errors.put(field, err.getDefaultMessage());
    });
    return ResponseEntity.badRequest()
        .body(new ApiErrorResponse(400, "Validation failed", errors, Instant.now()));
  }

  @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
  public ResponseEntity<ApiErrorResponse> handleForbidden(Exception ex) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(new ApiErrorResponse(403, ex.getMessage(), Map.of(), Instant.now()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiErrorResponse> handleGeneric(Exception ex) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(new ApiErrorResponse(500, "Unexpected error", Map.of(), Instant.now()));
  }
}
```

### Task 4 — `application.yml`
File: `backend/src/main/resources/application.yml`

```yaml
server:
  compression:
    enabled: true
    mime-types: application/json,text/html,text/css,application/javascript
    min-response-size: 1024

spring:
  jpa:
    show-sql: true
    open-in-view: false
    properties:
      hibernate:
        format_sql: true
  datasource:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
  flyway:
    enabled: true
    locations: classpath:db/migration
```

### Task 5 — PM: Create GitHub Issues
Create one GitHub Issue per member per day (Days 2–10). Label backend issues `backend`, frontend issues `frontend`. Assign to the correct member. This provides traceability for every PR.

---

## 🔵 Vinh (FE Lead)

### Task 1 — `src/lib/api.ts`

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach CSRF token on mutating requests
api.interceptors.request.use((config) => {
  const token = document.cookie
    .split('; ')
    .find((r) => r.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];
  if (token && ['post', 'put', 'patch', 'delete'].includes(config.method ?? '')) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      const redirect = encodeURIComponent(window.location.pathname);
      window.location.href = `/login?redirect=${redirect}`;
    }
    return Promise.reject(err);
  },
);

export default api;
```

### Task 2 — `src/lib/routes.ts`

```typescript
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  PROFILE: (id: number | string) => `/users/${id}`,
  COURSES: '/courses',
  COURSE_DETAIL: (id: number | string) => `/courses/${id}`,
  COURSE_EDIT: (id: number | string) => `/courses/${id}/edit`,
  LESSON: (courseId: number | string, lessonId: number | string) =>
    `/courses/${courseId}/lessons/${lessonId}`,
  DASHBOARD: '/dashboard',
  INSTRUCTOR: '/instructor',
  QUESTION_BANK: '/instructor/questions',
} as const;
```

### Task 3 — Scaffold route shells in `App.tsx`

Replace the current App.tsx with routes for all pages. Each unbuilt page renders a placeholder `<div>Coming soon: [PageName]</div>`. This ensures no 404s and the team can navigate to any route immediately.

### Task 4 — Set up MSW

```bash
# Run inside frontend/
pnpm exec msw init public/ --save
```

Create `src/mocks/browser.ts`:
```typescript
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
export const worker = setupWorker(...handlers);
```

Create `src/mocks/handlers/index.ts`:
```typescript
import type { RequestHandler } from 'msw';
export const handlers: RequestHandler[] = [];
// Individual handler files will import into here as features are built
```

Update `src/main.tsx`:
```typescript
async function prepare() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}
prepare().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode><App /></React.StrictMode>
  );
});
```

---

## 🔵 Sâm (FE Dev 1)

### Task 1 — `src/dtos/index.ts`

```typescript
// Pagination
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // 0-indexed
  size: number;
}

// API Error shape
export interface ApiError {
  status: number;
  message: string;
  errors: Record<string, string>;
  timestamp: string;
}

// Domain DTOs
export interface UserDto {
  id: number;
  email: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

export interface CourseDto {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  isPublished: boolean;
  visibility: 'Public' | 'Restricted' | 'Private';
  author: UserDto;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleDto {
  id: number;
  courseId: number;
  title: string;
  order: number;
  lessons: LessonDto[];
}

export interface LessonDto {
  id: number;
  title: string;
  lessonType: 'blog' | 'video' | 'test';
  order: number;
  moduleId: number;
  isCompleted?: boolean;
}

export type AccessStatus = 'none' | 'requested' | 'enrolled';
```

### Task 2 — `src/components/PageShell.tsx`

```tsx
export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 ${className ?? ''}`}
    >
      {children}
    </main>
  );
}
```

### Task 3 — `src/components/SectionHeader.tsx`

```tsx
export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
```

---

## 🔵 Tuấn (FE Dev 2)

### Task 1 — Add test/comment DTOs to `src/dtos/index.ts`
(Coordinate with Sâm — add to the same file or create `src/dtos/tests.ts` and `src/dtos/comments.ts` to avoid merge conflicts.)

```typescript
// src/dtos/tests.ts
export interface TestDto {
  id: number;
  statement: string;
  timeLimit: number; // seconds
  settings: string | null;
  lessonId: number;
}

export interface QuestionDto {
  id: number;
  statement: string;
  questionType: 'multiple_choice';
  authorId: number;
}

// For students — no correct_choices exposed
export interface McQuestionStudentDto extends QuestionDto {
  choices: string[];
  isSingleChoice: boolean;
}

// For instructors only
export interface McQuestionInstructorDto extends McQuestionStudentDto {
  correctChoices: number[];
}

export interface TestSessionDto {
  id: number;
  testId: number;
  userId: number;
  startedAt: string;
  isDone: boolean;
}

// src/dtos/comments.ts
export interface CommentDto {
  id: number;
  userId: number;
  author: import('./index').UserDto;
  content: string;
  parentId: number | null;
  replies?: CommentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementDto {
  id: number;
  courseId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
```

### Task 2 — `src/components/SkeletonCard.tsx`

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <Skeleton className="h-40 w-full rounded-md" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Task 3 — `src/components/EmptyState.tsx`

```tsx
import type { LucideIcon } from 'lucide-react';
import { BookOpen } from 'lucide-react';

export function EmptyState({
  icon: Icon = BookOpen,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon size={48} className="mb-4 text-muted-foreground" />
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

---

## ✅ End-of-Day Checklist

- [ ] `docker compose -f docker-compose.dev.yml up -d` starts Postgres
- [ ] `./mvnw spring-boot:run` applies both migrations without error
- [ ] `Permission.has()` unit test passes
- [ ] `pnpm dev` shows app without console errors
- [ ] Browser console shows `[MSW] Mocking enabled.`
- [ ] All code formatted (Spotless for Java, Prettier for TS)
- [ ] All work in merged PRs on `main`
