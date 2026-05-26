# Day 5 — Course Detail & Enrollment

**Goal**: Students can view course details and enroll. Enrolled students see the module/lesson list. Restricted course requests are sent.
**Done when**: Enroll button changes state (none → enrolled / requested), module sidebar appears for enrolled users.

---

## 🔴 Trung (BE Lead)

### Task 1 — Enrollment entity & endpoints
`EnrollmentEntity.java` (composite PK `(user_id, course_id)`):
```java
@Entity @Table(name = "enrollments")
public class EnrollmentEntity {
  @EmbeddedId private EnrollmentId id;
  private Instant createdAt;
  private Instant updatedAt;
}

@Embeddable
public record EnrollmentId(Long userId, Long courseId) implements Serializable {}
```

`POST /api/courses/{id}/enroll`:
```java
@PostMapping("/{id}/enroll")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<Void> enroll(@PathVariable Long id, Authentication auth) {
  Long userId = getCurrentUserId(auth);
  CourseEntity course = courseRepo.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

  if (course.getVisibility() == CourseVisibility.Private)
    return ResponseEntity.status(403).build();

  if (enrollmentRepo.existsById(new EnrollmentId(userId, id)))
    return ResponseEntity.status(409).build(); // already enrolled

  EnrollmentEntity e = new EnrollmentEntity();
  e.setId(new EnrollmentId(userId, id));
  e.setCreatedAt(Instant.now()); e.setUpdatedAt(Instant.now());
  enrollmentRepo.save(e);
  return ResponseEntity.status(201).build();
}
```

### Task 2 — Access requests (Separate Table Resolution)
File: `com/goctrithuc/courses/CourseAccessRequestEntity.java` (mapped to `course_access_requests`). Keeps `enrollments` clean and requires no status enum columns.

```java
@Entity
@Table(name = "course_access_requests")
@IdClass(CourseAccessRequestId.class)
public class CourseAccessRequestEntity {
  @Id @Column(name = "user_id") private Long userId;
  @Id @Column(name = "course_id") private Long courseId;
  @Column(name = "created_at") private Instant createdAt;
}
```

- `POST /api/courses/{id}/access-requests` — creates a record in `course_access_requests`.
- `DELETE /api/courses/{courseId}/access-requests/{userId}` — withdraws/declines request by deleting the record.
- `POST /api/courses/{courseId}/access-requests/{userId}/approve` — moves request to `enrollments` and deletes request.

`GET /api/courses/{id}/access-status`:
```java
@GetMapping("/{id}/access-status")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<Map<String, String>> accessStatus(
    @PathVariable Long id, Authentication auth) {
  Long userId = getCurrentUserId(auth);
  boolean enrolled = enrollmentRepo.existsById(new EnrollmentId(userId, id));
  if (enrolled) return ResponseEntity.ok(Map.of("status", "enrolled"));

  boolean requested = accessRequestRepo.existsByUserIdAndCourseId(userId, id);
  return ResponseEntity.ok(Map.of("status", requested ? "requested" : "none"));
}
```

### Task 3 — `GET /api/courses/{id}/modules` (with lessons, enrolled-gated)
Ensure this matches module outlines.

---

## 🔴 Anh (BE Dev / PM)

### Task 1 — ModuleEntity & LessonEntity (read-only for Day 5)
Implement simple Up/Down ordering columns.

### Task 2 — Integration tests for enrollment
- Student enrolls in public course → 201
- Student requests restricted access → record saved in `course_access_requests`
- Student tries to enroll in Private course → 403

---

## 🔵 Vinh (FE Lead)

### Task 1 — Course Detail page header
Update enroll logic to connect to local database access-request services.

---

## 🔵 Sâm (FE Dev 1)

### Task 1 — `ModuleSidebar` component
Expose outlines and completes lessons with checkmarks.

---

## 🔵 Tuấn (FE Dev 2)

### Task 1 — `RestrictedAccessBanner`
Handle access requests banner displays.

---

## ✅ End-of-Day Checklist
- [ ] Student enrolls in Public course → status changes to "enrolled" → modules outline loaded.
- [ ] Student requests Restricted course → status changes to "requested" in `course_access_requests` table.
- [ ] Private course returns 403 for non-author/admin.
