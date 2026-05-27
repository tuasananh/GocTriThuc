# Day 9 — Timed Quiz Session & Scoring Engine

**Goal**: Students can take timed tests. Each answer is saved as they select.
Submission calculates and stores the score. Result screen shows breakdown.
**Done when**: Full test flow works end-to-end: start → answer → countdown →
submit → view results. Countdown is crash-proof (server-calculated remaining
time).

---

## 🔴 Trung (BE Lead)

### Session management & Cascading Deletions

`TestSessionEntity.java`:

```java
@Entity @Table(name = "test_sessions")
public class TestSessionEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @Column(name = "user_id") private Long userId;
  @Column(name = "test_id") private Long testId;
  @Column(name = "started_at") private Instant startedAt;
  @Column(name = "submitted_at") private Instant submittedAt; // set when session is submitted
  @Column(name = "is_done") private boolean isDone;
  private Instant createdAt; private Instant updatedAt;
}
```

- Note: question deletion is a **hard-delete** with database-level
  `ON DELETE CASCADE`. Active quiz sessions will dynamically exclude the deleted
  question, and past quiz results will recalculate on-the-fly.

`POST /api/tests/{testId}/sessions` — start a session: Calculate remaining time
on server and return in payload `remainingTime` in seconds to prevent cheating
or refresh resets.

```java
@PostMapping("/{testId}/sessions")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<TestSessionResponse> startSession(
    @PathVariable Long testId, Authentication auth) {
  Long userId = getCurrentUserId(auth);

  LessonTestEntity test = lessonTestRepo.findById(testId)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  Long courseId = getCourseIdForTest(testId);
  if (!enrollmentRepo.existsById(new EnrollmentId(userId, courseId)))
    return ResponseEntity.status(403).build();

  Optional<TestSessionEntity> existing =
      sessionRepo.findByUserIdAndTestIdAndIsDoneFalse(userId, testId);

  if (existing.isPresent()) {
    TestSessionEntity s = existing.get();
    long elapsed = Instant.now().getEpochSecond() - s.getStartedAt().getEpochSecond();
    long remaining = test.getTimeLimit() - elapsed;
    return ResponseEntity.ok(TestSessionResponse.from(s, Math.max(0, remaining))); // resume
  }

  if (sessionRepo.existsByUserIdAndTestIdAndIsDoneTrue(userId, testId))
    return ResponseEntity.status(409).body(null); // already submitted

  TestSessionEntity s = new TestSessionEntity();
  // ID is assigned by DB via DEFAULT generate_snowflake_id() — do not set manually
  s.setUserId(userId); s.setTestId(testId);
  s.setStartedAt(Instant.now()); s.setDone(false);
  s.setCreatedAt(Instant.now()); s.setUpdatedAt(Instant.now());
  sessionRepo.save(s);
  return ResponseEntity.status(201).body(TestSessionResponse.from(s, test.getTimeLimit()));
}
```

---

## 🔴 Anh (BE Dev / PM)

### Task 1 — `ScoreService.calculateResult`

Scoring calculations automatically adapt to the number of active questions. If a
question is deleted, points dynamically scale against active ones.

---

## 🔵 Vinh (FE Lead)

### Timed Quiz Player Interface

File: `src/pages/tests/TestPage.tsx` Initialize timer strictly using the
server-calculated `remainingTime` to remain robust against page refreshes.

```tsx
useEffect(() => {
  Promise.all([
    api.get<TestDto>(`/api/tests/${testId}`),
    api.post<TestSessionDto & { remainingTime: number }>(
      `/api/tests/${testId}/sessions`,
    ),
    api.get<McQuestionStudentDto[]>(`/api/tests/${testId}/questions`),
  ]).then(([testRes, sessionRes, qRes]) => {
    setSession(sessionRes.data);
    setQuestions(qRes.data);

    // Timer initialized from server-calculated remainingTime!
    setSecondsLeft(sessionRes.data.remainingTime);
  });
}, [testId]);
```

---

## 🔵 Sâm (FE Dev 1)

### Option selector component

Renders options as radio lists or checkboxes.

---

## 🔵 Tuấn (FE Dev 2)

### Result review dashboards

Displays test metrics and results page.

---

## ✅ End-of-Day Checklist

- [ ] Active remaining time calculated server-side and returned to frontend.
- [ ] Re-entering active quiz session resumes exact countdown seconds.
- [ ] Dynamic score calculations correctly handle deleted questions on past quiz
      sessions on-the-fly.
- [ ] `submitted_at` is set accurately on final submission for "time taken"
      display.
