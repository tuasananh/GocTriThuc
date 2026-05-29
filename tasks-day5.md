# Day 5 — Course Detail & Enrollment

**Goal**: Students can view course details and enroll. Enrolled students see the
module/lesson list. Restricted course requests are sent.

**Done when**: Enroll button changes state (none → enrolled / requested), module
sidebar appears for enrolled users.

**SRS source of truth**: `SRS.md` sections F2.5, F6, F8. Module/Lesson structure
from `proposed_schema.sql`.

---

## Nhiệm Vụ Cần Làm

### 1. Database Migrations

#### 1.1 `V<timestamp>__create_enrollments_table.sql`

```sql
CREATE TABLE enrollments (
  user_id    BIGINT NOT NULL,
  course_id   BIGINT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id),
  FOREIGN KEY (user_id)    REFERENCES users(id),
  FOREIGN KEY (course_id)  REFERENCES courses(id)
);

CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 1.2 `V<timestamp>__create_course_access_requests_table.sql`

```sql
CREATE TABLE course_access_requests (
  user_id    BIGINT NOT NULL,
  course_id  BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id),
  FOREIGN KEY (user_id)   REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Bảng này là insert/delete only (không có cột updated_at, không cần trigger)
```

#### 1.3 `V<timestamp>__create_modules_table.sql`

```sql
CREATE TABLE modules (
  id         BIGINT PRIMARY KEY DEFAULT generate_snowflake_id(),
  course_id  BIGINT NOT NULL,
  title       VARCHAR(255) NOT NULL,
  "order"     INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT uq_modules_course_order UNIQUE (course_id, "order") DEFERRABLE INITIALLY DEFERRED
);

CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 1.4 `V<timestamp>__create_lessons_table.sql`

```sql
CREATE TYPE lesson_type AS ENUM ('video', 'blog', 'test');

CREATE TABLE lessons (
  id          BIGINT PRIMARY KEY DEFAULT generate_snowflake_id(),
  module_id   BIGINT NOT NULL,
  title       VARCHAR(255) NOT NULL,
  lesson_type lesson_type NOT NULL,
  "order"     INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  CONSTRAINT uq_lessons_module_order UNIQUE (module_id, "order") DEFERRABLE INITIALLY DEFERRED
);

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 1.5 `V<timestamp>__create_lesson_completions_table.sql`

```sql
CREATE TABLE lesson_completions (
  user_id    BIGINT NOT NULL,
  lesson_id  BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_id),
  FOREIGN KEY (user_id)   REFERENCES users(id),
  FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);
```

---

### 2. JPA Entities

#### 2.1 `EnrollmentEntity.java`

```java
// package: com.goctrithuc.backend.entities
// location: src/main/java/com/goctrithuc/backend/entities/EnrollmentEntity.java

@Entity
@Table(name = "enrollments")
public class EnrollmentEntity {
  @EmbeddedId
  private EnrollmentId id;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  // Getters, setters, equals/hashCode
}

@Embeddable
public record EnrollmentId(Long userId, Long courseId) implements Serializable {}
```

#### 2.2 `CourseAccessRequestEntity.java`

```java
// package: com.goctrithuc.backend.entities
// location: src/main/java/com/goctrithuc/backend/entities/CourseAccessRequestEntity.java

@Entity
@Table(name = "course_access_requests")
@IdClass(CourseAccessRequestId.class)
public class CourseAccessRequestEntity {
  @Id
  @Column(name = "user_id")
  private Long userId;

  @Id
  @Column(name = "course_id")
  private Long courseId;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  // Getters, setters, equals/hashCode
}

@Embeddable
public record CourseAccessRequestId(Long userId, Long courseId) implements Serializable {}
```

#### 2.3 `ModuleEntity.java`

```java
// package: com.goctrithuc.backend.entities
// location: src/main/java/com/goctrithuc/backend/entities/ModuleEntity.java

@Entity
@Table(name = "modules")
public class ModuleEntity {
  @Id
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "course_id", nullable = false)
  private Course course;

  @Column(nullable = false)
  private String title;

  @Column(name = "\"order\"", nullable = false)
  private Integer order;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  // Getters, setters
}
```

#### 2.4 `LessonEntity.java`

```java
// package: com.goctrithuc.backend.entities
// location: src/main/java/com/goctrithuc/backend/entities/LessonEntity.java

@Entity
@Table(name = "lessons")
public class LessonEntity {
  @Id
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "module_id", nullable = false)
  private ModuleEntity module;

  @Column(nullable = false)
  private String title;

  @Enumerated(EnumType.STRING)
  @Column(name = "lesson_type", columnDefinition = "lesson_type", nullable = false)
  private LessonType type;

  @Column(name = "\"order\"", nullable = false)
  private Integer order;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  // Getters, setters
}

public enum LessonType {
  VIDEO, BLOG, TEST
}
```

#### 2.5 `LessonCompletionEntity.java`

```java
// package: com.goctrithuc.backend.entities
// location: src/main/java/com/goctrithuc/backend/entities/LessonCompletionEntity.java

@Entity
@Table(name = "lesson_completions")
public class LessonCompletionEntity {
  @EmbeddedId
  private LessonCompletionId id;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  // Getters, setters, equals/hashCode
}

@Embeddable
public record LessonCompletionId(Long userId, Long lessonId) implements Serializable {}
```

#### 2.7 Update `Course.java` — add modules relationship

```java
// Trong Course.java, thêm:

@OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
@OrderBy("\"order\" ASC")
private List<ModuleEntity> modules = new ArrayList<>();
```

---

### 3. Repositories

#### 3.1 `EnrollmentRepository.java`

```java
// package: com.goctrithuc.backend.repositories
// location: src/main/java/com/goctrithuc/backend/repositories/EnrollmentRepository.java

@Repository
public interface EnrollmentRepository extends JpaRepository<EnrollmentEntity, EnrollmentId> {
  boolean existsById(EnrollmentId id);
  void deleteById(EnrollmentId id);
}
```

#### 3.2 `CourseAccessRequestRepository.java`

```java
// package: com.goctrithuc.backend.repositories
// location: src/main/java/com/goctrithuc/backend/repositories/CourseAccessRequestRepository.java

@Repository
public interface CourseAccessRequestRepository extends JpaRepository<CourseAccessRequestEntity, CourseAccessRequestId> {
  boolean existsByUserIdAndCourseId(Long userId, Long courseId);
  List<CourseAccessRequestEntity> findByCourseId(Long courseId);
  Optional<CourseAccessRequestEntity> findByUserIdAndCourseId(Long userId, Long courseId);
  void deleteByUserIdAndCourseId(Long userId, Long courseId);
}
```

#### 3.3 `ModuleRepository.java`

```java
// package: com.goctrithuc.backend.repositories
// location: src/main/java/com/goctrithuc/backend/repositories/ModuleRepository.java

@Repository
public interface ModuleRepository extends JpaRepository<ModuleEntity, Long> {
  List<ModuleEntity> findByCourseIdOrderByOrderAsc(Long courseId);
  boolean existsByIdAndCourseId(Long id, Long courseId);
}
```

#### 3.4 `LessonRepository.java`

```java
// package: com.goctrithuc.backend.repositories
// location: src/main/java/com/goctrithuc/backend/repositories/LessonRepository.java

@Repository
public interface LessonRepository extends JpaRepository<LessonEntity, Long> {
  List<LessonEntity> findByModuleIdOrderByOrderAsc(Long moduleId);
  boolean existsByIdAndModuleId(Long id, Long moduleId);
  long countByModuleCourseId(Long courseId);
}
```

#### 3.5 `LessonCompletionRepository.java`

```java
// package: com.goctrithuc.backend.repositories
// location: src/main/java/com/goctrithuc/backend/repositories/LessonCompletionRepository.java

@Repository
public interface LessonCompletionRepository extends JpaRepository<LessonCompletionEntity, LessonCompletionId> {
  boolean existsById(LessonCompletionId id);
  void deleteById(LessonCompletionId id);
  long countByLessonId(Long lessonId);

  @Query("SELECT COUNT(lc) FROM LessonCompletionEntity lc " +
         "WHERE lc.id.userId = :userId " +
         "AND lc.id.lessonId IN " +
         "(SELECT l.id FROM LessonEntity l WHERE l.module.course.id = :courseId)")
  long countByUserIdAndCourseId(@Param("userId") Long userId, @Param("courseId") Long courseId);
}
```

---

### 4. DTOs

#### 4.1 `EnrollmentResponse.java`

```java
// package: com.goctrithuc.backend.dtos

public record EnrollmentResponse(
  Long userId,
  Long courseId,
  Instant enrolledAt
) {}
```

#### 4.2 `AccessStatusResponse.java`

```java
// package: com.goctrithuc.backend.dtos

public record AccessStatusResponse(String status) {}
// status = "enrolled" | "requested" | "none"
```

#### 4.3 `AccessRequestResponse.java`

```java
// package: com.goctrithuc.backend.dtos

public record AccessRequestResponse(
  Long userId,
  Long courseId,
  String userDisplayName,
  Instant requestedAt
) {}
```

#### 4.4 `ModuleResponse.java`

```java
// package: com.goctrithuc.backend.dtos

public record ModuleResponse(
  Long id,
  String title,
  Integer order,
  List<LessonSummaryResponse> lessons
) {}

public record LessonSummaryResponse(
  Long id,
  String title,
  LessonType type,
  Integer order
) {}
```

#### 4.5 `CourseProgressResponse.java`

```java
// package: com.goctrithuc.backend.dtos

public record CourseProgressResponse(
  long completedLessons,
  long totalLessons,
  int percent
) {}
```

---

### 5. Services

#### 5.1 `EnrollmentService.java`

```java
// package: com.goctrithuc.backend.services
// location: src/main/java/com/goctrithuc/backend/services/EnrollmentService.java

@Service
@RequiredArgsConstructor
public class EnrollmentService {

  private final EnrollmentRepository enrollmentRepo;
  private final CourseAccessRequestRepository accessRequestRepo;
  private final CourseRepository courseRepo;
  private final PermissionService permissionService;

  public void enroll(Long userId, Long courseId) {
    Course course = courseRepo.findById(courseId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

    // SRS F2.5: Chỉ Public courses mới cho phép enroll trực tiếp
    if (course.getVisibility() == CourseVisibility.PRIVATE)
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          "Private courses cannot be enrolled in directly");

    if (course.getVisibility() == CourseVisibility.RESTRICTED)
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Restricted courses require an access request — use POST /api/courses/{id}/access-requests");

    if (enrollmentRepo.existsById(new EnrollmentId(userId, courseId)))
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Already enrolled");

    EnrollmentEntity e = new EnrollmentEntity();
    e.setId(new EnrollmentId(userId, courseId));
    e.setCreatedAt(Instant.now());
    e.setUpdatedAt(Instant.now());
    enrollmentRepo.save(e);
  }

  public void unenroll(Long userId, Long courseId) {
    enrollmentRepo.deleteById(new EnrollmentId(userId, courseId));
  }

  public String getAccessStatus(Long userId, Long courseId) {
    if (enrollmentRepo.existsById(new EnrollmentId(userId, courseId)))
      return "enrolled";
    if (accessRequestRepo.existsByUserIdAndCourseId(userId, courseId))
      return "requested";
    return "none";
  }
}
```

#### 5.2 `AccessRequestService.java`

```java
// package: com.goctrithuc.backend.services
// location: src/main/java/com/goctrithuc/backend/services/AccessRequestService.java

@Service
@RequiredArgsConstructor
public class AccessRequestService {

  private final CourseAccessRequestRepository accessRequestRepo;
  private final EnrollmentRepository enrollmentRepo;
  private final CourseRepository courseRepo;
  private final PermissionService permissionService;

  public void requestAccess(Long userId, Long courseId) {
    Course course = courseRepo.findById(courseId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

    if (course.getVisibility() != CourseVisibility.RESTRICTED)
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Only restricted courses accept access requests");

    if (enrollmentRepo.existsById(new EnrollmentId(userId, courseId)))
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Already enrolled");

    if (accessRequestRepo.existsByUserIdAndCourseId(userId, courseId))
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Already requested");

    CourseAccessRequestEntity req = new CourseAccessRequestEntity();
    req.setUserId(userId);
    req.setCourseId(courseId);
    req.setCreatedAt(Instant.now());
    accessRequestRepo.save(req);
  }

  public void approveAccessRequest(Long courseId, Long userId) {
    // 1. Create enrollment
    EnrollmentEntity e = new EnrollmentEntity();
    e.setId(new EnrollmentId(userId, courseId));
    e.setCreatedAt(Instant.now());
    e.setUpdatedAt(Instant.now());
    enrollmentRepo.save(e);

    // 2. Delete request
    accessRequestRepo.deleteByUserIdAndCourseId(userId, courseId);
  }

  public void rejectAccessRequest(Long courseId, Long userId) {
    accessRequestRepo.deleteByUserIdAndCourseId(userId, courseId);
  }

  public List<AccessRequestResponse> getAccessRequests(Long courseId) {
    return accessRequestRepo.findByCourseId(courseId).stream()
        .map(req -> new AccessRequestResponse(
            req.getUserId(),
            req.getCourseId(),
            null, // userDisplayName: resolve via userRepo lookup
            req.getCreatedAt()))
        .toList();
  }
}
```

#### 5.3 `CurriculumService.java`

```java
// package: com.goctrithuc.backend.services
// location: src/main/java/com/goctrithuc/backend/services/CurriculumService.java

@Service
@RequiredArgsConstructor
public class CurriculumService {

  private final ModuleRepository moduleRepo;
  private final LessonRepository lessonRepo;

  public List<ModuleResponse> getModulesWithLessons(Long courseId) {
    List<ModuleEntity> modules = moduleRepo.findByCourseIdOrderByOrderAsc(courseId);
    return modules.stream().map(m -> {
      List<LessonSummaryResponse> lessons = lessonRepo
          .findByModuleIdOrderByOrderAsc(m.getId())
          .stream()
          .map(l -> new LessonSummaryResponse(l.getId(), l.getTitle(), l.getType(), l.getOrder()))
          .toList();
      return new ModuleResponse(m.getId(), m.getTitle(), m.getOrder(), lessons);
    }).toList();
  }

  public boolean isEnrolledOrAuthorOrAdmin(Long userId, Long courseId, boolean isAdmin) {
    // Check in EnrollmentService
    return false;
  }
}
```

#### 5.4 `LessonCompletionService.java`

```java
// package: com.goctrithuc.backend.services
// location: src/main/java/com/goctrithuc/backend/services/LessonCompletionService.java

@Service
@RequiredArgsConstructor
public class LessonCompletionService {

  private final LessonCompletionRepository completionRepo;
  private final LessonRepository lessonRepo;
  private final EnrollmentRepository enrollmentRepo;

  public void toggleCompletion(Long userId, Long lessonId) {
    LessonCompletionId id = new LessonCompletionId(userId, lessonId);
    if (completionRepo.existsById(id)) {
      completionRepo.deleteById(id);
    } else {
      LessonCompletionEntity e = new LessonCompletionEntity();
      e.setId(id);
      e.setCreatedAt(Instant.now());
      completionRepo.save(e);
    }
  }

  public CourseProgressResponse getProgress(Long userId, Long courseId) {
    // totalLessons = count lessons in course via modules
    // completedLessons = count lesson_completions for user in those lessons
    long totalLessons = lessonRepo.countByModuleCourseId(courseId);
    long completedLessons = completionRepo.countByUserIdAndCourseId(userId, courseId);
    int percent = totalLessons == 0 ? 0 : (int) (completedLessons * 100 / totalLessons);
    return new CourseProgressResponse(completedLessons, totalLessons, percent);
  }
}
```

**Note**: Các methods bổ sung (`countByModuleCourseId`, `countByUserIdAndCourseId`) đã được define trong Repositories ở section 3.

---

### 6. Controller Endpoints

Thêm vào `CourseController.java`:

```java
// === Enrollment ===

// GET /api/courses/{id}/access-status
@GetMapping("/{id}/access-status")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<AccessStatusResponse> accessStatus(
    @PathVariable Long id, Authentication auth) {
  Long userId = getCurrentUserId(auth);
  String status = enrollmentService.getAccessStatus(userId, id);
  return ResponseEntity.ok(new AccessStatusResponse(status));
}

// POST /api/courses/{id}/enroll
@PostMapping("/{id}/enroll")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<Void> enroll(@PathVariable Long id, Authentication auth) {
  enrollmentService.enroll(getCurrentUserId(auth), id);
  return ResponseEntity.status(201).build();
}

// DELETE /api/courses/{id}/enroll
@DeleteMapping("/{id}/enroll")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<Void> unenroll(@PathVariable Long id, Authentication auth) {
  enrollmentService.unenroll(getCurrentUserId(auth), id);
  return ResponseEntity.noContent().build();
}

// === Access Requests ===

// POST /api/courses/{id}/access-requests
@PostMapping("/{id}/access-requests")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<Void> requestAccess(@PathVariable Long id, Authentication auth) {
  accessRequestService.requestAccess(getCurrentUserId(auth), id);
  return ResponseEntity.status(201).build();
}

// GET /api/courses/{id}/access-requests  (for instructor/admin)
@GetMapping("/{id}/access-requests")
@PreAuthorize("@permissionService.hasPermission(authentication, 'MANAGE_OWN_COURSES')")
public ResponseEntity<List<AccessRequestResponse>> getAccessRequests(
    @PathVariable Long id, Authentication auth) {
  // Service layer double-checks: course author or admin
  return ResponseEntity.ok(accessRequestService.getAccessRequests(id));
}

// POST /api/courses/{courseId}/access-requests/{userId}/approve
@PostMapping("/{courseId}/access-requests/{userId}/approve")
@PreAuthorize("@permissionService.hasPermission(authentication, 'MANAGE_OWN_COURSES')")
public ResponseEntity<Void> approveAccessRequest(
    @PathVariable Long courseId,
    @PathVariable Long userId,
    Authentication auth) {
  // Service layer double-checks: course author or admin
  accessRequestService.approveAccessRequest(courseId, userId);
  return ResponseEntity.status(201).build();
}

// DELETE /api/courses/{courseId}/access-requests/{userId}
@DeleteMapping("/{courseId}/access-requests/{userId}")
@PreAuthorize("@permissionService.hasPermission(authentication, 'MANAGE_OWN_COURSES')")
public ResponseEntity<Void> rejectAccessRequest(
    @PathVariable Long courseId,
    @PathVariable Long userId,
    Authentication auth) {
  // Service layer double-checks: course author or admin
  accessRequestService.rejectAccessRequest(courseId, userId);
  return ResponseEntity.noContent().build();
}

// === Curriculum ===

// GET /api/courses/{id}/modules
@GetMapping("/{id}/modules")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<List<ModuleResponse>> getModules(
    @PathVariable Long id,
    Authentication auth) {
  Long userId = getCurrentUserId(auth);
  // Admin status PHẢI được resolve server-side, KHÔNG qua @RequestParam
  boolean isAdmin = permissionService.isAdmin(userId);
  boolean isEnrolled = enrollmentService.getAccessStatus(userId, id).equals("enrolled");
  boolean isAuthor = courseRepo.existsByIdAndAuthorId(id, userId);
  if (!isEnrolled && !isAuthor && !isAdmin) {
    throw new ResponseStatusException(HttpStatus.FORBIDDEN);
  }
  return ResponseEntity.ok(curriculumService.getModulesWithLessons(id));
}

// === Progress ===
// (POST /api/lessons/{id}/complete nằm trong LessonController — xem bên dưới)

// GET /api/courses/{id}/progress
@GetMapping("/{id}/progress")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<CourseProgressResponse> getProgress(@PathVariable Long id, Authentication auth) {
  return ResponseEntity.ok(lessonCompletionService.getProgress(getCurrentUserId(auth), id));
}
```

Tạo `LessonController.java` riêng cho `/api/lessons` endpoints:
```java
@RestController
@RequestMapping("/api/lessons")
@RequiredArgsConstructor
public class LessonController {

  private final LessonCompletionService lessonCompletionService;

  // POST /api/lessons/{id}/complete — toggle lesson completion (SRS F6)
  @PostMapping("/{id}/complete")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> toggleComplete(@PathVariable Long id, Authentication auth) {
    // Service layer checks: user must be enrolled in the lesson's course
    lessonCompletionService.toggleCompletion(getCurrentUserId(auth), id);
    return ResponseEntity.noContent().build();
  }
}
```

---

### 7. Items Đã Xác Nhận (SRS là source of truth)

#### 7.1 — Access request list

SRS F8 (Instructor Dashboard) line 517: Access Requests là phần của instructor dashboard.
SRS API Surface line 749: `GET /api/courses/{id}/access-requests` là endpoint hợp lệ.
→ **Trung làm luôn** trong Day 5. Đã include trong file này.

#### 7.2 — Module columns

SRS F3.1 chỉ nói "ordered list of Modules" với title và order management. Không có description.
→ **Chỉ `id, title, order`** (đơn giản nhất).

#### 7.3 — Lesson columns

SRS F3.2: lessons có type (`blog`, `video`, `test`) và subtype tables riêng (table-per-type pattern).
Day 5 chỉ cần base columns. Subtype tables (`lesson_blogs`, `lesson_videos`, `lesson_tests`) là Day 6+.
→ **Chỉ `id, module_id, title, type, order`**.

#### 7.4 — Lesson completions (F6)

SRS F6 line 469-478: `lesson_completions` table có trong data model. `POST /api/lessons/{id}/complete` toggle completion.
ModuleSidebar cần hiển thị checkmark → tạo luôn trong Day 5.

---

### 8. Checklist — End of Day 5

- [ ] `V<timestamp>__create_enrollments_table.sql` migration chạy OK
- [ ] `V<timestamp>__create_course_access_requests_table.sql` migration chạy OK
- [ ] `V<timestamp>__create_modules_table.sql` migration chạy OK
- [ ] `V<timestamp>__create_lessons_table.sql` migration chạy OK
- [ ] `V<timestamp>__create_lesson_completions_table.sql` migration chạy OK
- [ ] `EnrollmentEntity` + `EnrollmentId` hoạt động
- [ ] `CourseAccessRequestEntity` + `CourseAccessRequestId` hoạt động
- [ ] `ModuleEntity` hoạt động
- [ ] `LessonEntity` hoạt động
- [ ] `LessonCompletionEntity` + `LessonCompletionId` hoạt động
- [ ] `EnrollmentRepository` hoạt động
- [ ] `CourseAccessRequestRepository` hoạt động
- [ ] `ModuleRepository` hoạt động
- [ ] `LessonRepository` hoạt động
- [ ] `LessonCompletionRepository` hoạt động
- [ ] `POST /api/courses/{id}/enroll` → 201 (Public course)
- [ ] `POST /api/courses/{id}/enroll` → 403 (Private course)
- [ ] `POST /api/courses/{id}/enroll` → 400 (Restricted course — phải dùng access-requests)
- [ ] `POST /api/courses/{id}/enroll` → 409 (already enrolled)
- [ ] `DELETE /api/courses/{id}/enroll` → 204
- [ ] `GET /api/courses/{id}/access-status` → `"enrolled"` (enrolled user)
- [ ] `GET /api/courses/{id}/access-status` → `"requested"` (pending request)
- [ ] `GET /api/courses/{id}/access-status` → `"none"` (not enrolled, no request)
- [ ] `POST /api/courses/{id}/access-requests` → 201 (Restricted course)
- [ ] `POST /api/courses/{id}/access-requests` → 400 (Public course)
- [ ] `POST /api/courses/{id}/access-requests` → 409 (already requested)
- [ ] `POST /api/courses/{courseId}/access-requests/{userId}/approve` → 201 + enrollment row created
- [ ] `DELETE /api/courses/{courseId}/access-requests/{userId}` → 204 (reject)
- [ ] `GET /api/courses/{id}/modules` → 200 + module/lesson tree (enrolled user)
- [ ] `GET /api/courses/{id}/modules` → 403 (non-enrolled user)
- [ ] `POST /api/lessons/{id}/complete` → 204 + completion toggled (enrolled student)
- [ ] `POST /api/lessons/{id}/complete` → 403 (non-enrolled user)
- [ ] `GET /api/courses/{id}/progress` → 200 + {completedLessons, totalLessons, percent}
- [ ] Integration tests: student enrolls public → 201
- [ ] Integration tests: student requests restricted → record in `course_access_requests`
- [ ] Integration tests: student enrolls private → 403
