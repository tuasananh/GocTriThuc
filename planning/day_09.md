# Day 9 — Test Sessions & Scoring

**Goal**: Students can take timed tests. Each answer is saved as they select. Submission calculates and stores the score. Result screen shows breakdown.
**Done when**: Full test flow works end-to-end: start → answer → countdown → submit → view results.

---

## 🔴 Trung (BE Lead)

### Session management
`TestSessionEntity.java`:
```java
@Entity @Table(name = "test_sessions")
public class TestSessionEntity {
  @Id private Long id;
  @Column(name = "user_id") private Long userId;
  @Column(name = "test_id") private Long testId;
  @Column(name = "started_at") private Instant startedAt;
  @Column(name = "is_done") private boolean isDone;
  private Instant createdAt; private Instant updatedAt;
}
```

`POST /api/tests/{testId}/sessions` — start a session:
```java
@PostMapping("/{testId}/sessions")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<TestSessionResponse> startSession(
    @PathVariable Long testId, Authentication auth) {
  Long userId = getCurrentUserId(auth);

  // Check enrollment
  LessonTestEntity test = lessonTestRepo.findById(testId)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  Long courseId = getCourseIdForTest(testId);
  if (!enrollmentRepo.existsById(new EnrollmentId(userId, courseId)))
    return ResponseEntity.status(403).build();

  // Only one active session per test per user
  Optional<TestSessionEntity> existing =
      sessionRepo.findByUserIdAndTestIdAndIsDoneFalse(userId, testId);
  if (existing.isPresent())
    return ResponseEntity.ok(TestSessionResponse.from(existing.get())); // resume

  // Check if already completed
  if (sessionRepo.existsByUserIdAndTestIdAndIsDoneTrue(userId, testId))
    return ResponseEntity.status(409).body(null); // already submitted

  TestSessionEntity s = new TestSessionEntity();
  s.setId(idGenerator.nextId());
  s.setUserId(userId); s.setTestId(testId);
  s.setStartedAt(Instant.now()); s.setDone(false);
  s.setCreatedAt(Instant.now()); s.setUpdatedAt(Instant.now());
  return ResponseEntity.status(201).body(TestSessionResponse.from(sessionRepo.save(s)));
}
```

`PUT /api/sessions/{sessionId}/answers` — save one answer:
```java
@PutMapping("/{sessionId}/answers")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<Void> saveAnswer(
    @PathVariable Long sessionId,
    @Valid @RequestBody SaveAnswerRequest req, Authentication auth) {
  TestSessionEntity session = sessionRepo.findById(sessionId)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  if (!session.getUserId().equals(getCurrentUserId(auth)))
    return ResponseEntity.status(403).build();
  if (session.isDone())
    return ResponseEntity.status(409).build(); // already submitted

  // Upsert
  testSessionAnswerRepo.findBySessionIdAndQuestionId(sessionId, req.questionId())
      .ifPresentOrElse(a -> {
        a.setQuestionAnswer(req.answer()); a.setUpdatedAt(Instant.now());
        testSessionAnswerRepo.save(a);
      }, () -> {
        TestSessionAnswerEntity a = new TestSessionAnswerEntity();
        a.setId(idGenerator.nextId());
        a.setSessionId(sessionId); a.setQuestionId(req.questionId());
        a.setQuestionAnswer(req.answer());
        a.setCreatedAt(Instant.now()); a.setUpdatedAt(Instant.now());
        testSessionAnswerRepo.save(a);
      });
  return ResponseEntity.noContent().build();
}

public record SaveAnswerRequest(@NotNull Long questionId, String answer) {}
// answer format: comma-separated choice indices e.g. "0" or "0,2"
```

`POST /api/sessions/{sessionId}/submit`:
```java
@PostMapping("/{sessionId}/submit")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<TestResultResponse> submit(
    @PathVariable Long sessionId, Authentication auth) {
  TestSessionEntity session = sessionRepo.findById(sessionId)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  if (!session.getUserId().equals(getCurrentUserId(auth)))
    return ResponseEntity.status(403).build();
  if (session.isDone())
    return ResponseEntity.status(409).build();

  session.setDone(true); session.setUpdatedAt(Instant.now());
  sessionRepo.save(session);

  TestResultResponse result = scoreService.calculateResult(session);
  return ResponseEntity.ok(result);
}
```

`GET /api/sessions/{sessionId}/result` — for viewing a completed session:
Same as submit response but read-only.

---

## 🔴 Anh (BE Dev / PM)

### `ScoreService.calculateResult`
```java
@Service
public class ScoreService {

  public TestResultResponse calculateResult(TestSessionEntity session) {
    List<TestQuestionEntity> tqs = testQuestionRepo
        .findByTestIdOrderByOrder(session.getTestId());
    List<TestSessionAnswerEntity> answers = testSessionAnswerRepo
        .findBySessionId(session.getId());

    Map<Long, String> answerMap = answers.stream()
        .collect(Collectors.toMap(TestSessionAnswerEntity::getQuestionId,
            a -> Objects.requireNonNullElse(a.getQuestionAnswer(), "")));

    double totalPoints = 0, earnedPoints = 0;
    List<QuestionResultItem> items = new ArrayList<>();

    for (TestQuestionEntity tq : tqs) {
      double points = tq.getPoint() != null ? tq.getPoint() : 1.0;
      totalPoints += points;

      McQuestionEntity mc = mcQuestionRepo.findById(tq.getQuestionId()).orElseThrow();
      String given = answerMap.getOrDefault(tq.getQuestionId(), "");
      double earned = scoreAnswer(mc, given, points);
      earnedPoints += earned;

      items.add(new QuestionResultItem(
          tq.getQuestionId(), mc.getChoices(), mc.getCorrectChoices(),
          given, earned, points));
    }

    int percent = totalPoints == 0 ? 0 : (int) (earnedPoints * 100 / totalPoints);
    return new TestResultResponse(earnedPoints, totalPoints, percent, items);
  }

  // All-or-nothing scoring
  double scoreAnswer(McQuestionEntity mc, String given, double maxPoints) {
    if (given == null || given.isBlank()) return 0;
    Set<Integer> givenSet = Arrays.stream(given.split(","))
        .map(String::trim).filter(s -> !s.isEmpty())
        .map(Integer::parseInt).collect(Collectors.toSet());
    Set<Integer> correctSet = IntStream.of(mc.getCorrectChoices())
        .boxed().collect(Collectors.toSet());
    return givenSet.equals(correctSet) ? maxPoints : 0;
  }
}
```

### Integration tests for full test session lifecycle
```
1. POST /api/tests/{id}/sessions → 201, returns session with id + startedAt
2. PUT /api/sessions/{id}/answers with each question → 204
3. POST /api/sessions/{id}/submit → 200, returns TestResultResponse
4. POST /api/sessions/{id}/submit again → 409 (already submitted)
5. GET /api/sessions/{id}/result → 200, same result
```

---

## 🔵 Vinh (FE Lead)

### Test Viewer page
File: `src/pages/tests/TestPage.tsx`

```tsx
export function TestPage() {
  const { testId } = useParams<{ testId: string }>();
  const [session, setSession] = useState<TestSessionDto | null>(null);
  const [questions, setQuestions] = useState<McQuestionStudentDto[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TestResultResponse | null>(null);

  // Load test & start session
  useEffect(() => {
    Promise.all([
      api.get<TestDto>(`/api/tests/${testId}`),
      api.post<TestSessionDto>(`/api/tests/${testId}/sessions`),
      api.get<McQuestionStudentDto[]>(`/api/tests/${testId}/questions`),
    ]).then(([testRes, sessionRes, qRes]) => {
      // If 409 on session → show result view
      setSession(sessionRes.data);
      setQuestions(qRes.data);
      setSecondsLeft(testRes.data.timeLimit);
    });
  }, [testId]);

  // Countdown timer
  useEffect(() => {
    if (!session || secondsLeft <= 0 || result) return;
    const t = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(t); submit(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [session, result]);

  const saveAnswer = async (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    await api.put(`/api/sessions/${session!.id}/answers`, { questionId, answer: value });
  };

  const submit = async () => {
    if (submitting || !session) return;
    setSubmitting(true);
    const res = await api.post<TestResultResponse>(`/api/sessions/${session.id}/submit`);
    setResult(res.data);
    setSubmitting(false);
  };

  if (result) return <TestResultScreen result={result} />;
  if (!session || questions.length === 0) return <div className="flex justify-center p-16"><Loader2 className="animate-spin" size={32}/></div>;

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const urgent = secondsLeft < 300; // < 5 min

  return (
    <div className="flex min-h-screen">
      {/* Question navigator sidebar */}
      <aside className="hidden w-48 shrink-0 border-r border-border p-4 lg:block">
        <p className={`text-2xl font-mono font-bold text-center mb-4 ${urgent ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
          {mm}:{ss}
        </p>
        <div className="grid grid-cols-4 gap-1">
          {questions.map((q, i) => (
            <button key={q.id} onClick={() => setCurrent(i)}
              className={`rounded text-xs p-1 font-medium transition-colors ${
                i === current ? 'bg-primary text-primary-foreground'
                : answers[q.id] ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-muted text-muted-foreground'
              }`}>
              {i + 1}
            </button>
          ))}
        </div>
        <Button className="mt-4 w-full" onClick={submit} disabled={submitting}
          id="btn-submit-test">
          {submitting ? <Loader2 size={16} className="animate-spin mr-2"/> : null}
          Nộp bài
        </Button>
      </aside>
      {/* Question area */}
      <main className="flex-1 p-8 max-w-2xl mx-auto">
        <MultipleChoiceQuestion
          question={questions[current]}
          currentAnswer={answers[questions[current]?.id] ?? ''}
          onAnswer={(val) => saveAnswer(questions[current].id, val)}
          index={current}
          total={questions.length}
        />
        <div className="mt-8 flex justify-between">
          <Button variant="outline" disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>← Câu trước</Button>
          <Button disabled={current === questions.length - 1} onClick={() => setCurrent(c => c + 1)}>Câu tiếp →</Button>
        </div>
      </main>
    </div>
  );
}
```

---

## 🔵 Sâm (FE Dev 1)

### `MultipleChoiceQuestion` component
```tsx
export function MultipleChoiceQuestion({ question, currentAnswer, onAnswer, index, total }: {
  question: McQuestionStudentDto;
  currentAnswer: string;
  onAnswer: (val: string) => void;
  index: number;
  total: number;
}) {
  const selected = currentAnswer ? currentAnswer.split(',').map(Number) : [];

  const toggle = (idx: number) => {
    if (question.isSingleChoice) {
      onAnswer(String(idx));
    } else {
      const next = selected.includes(idx)
        ? selected.filter(i => i !== idx)
        : [...selected, idx];
      onAnswer(next.sort().join(','));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Câu {index + 1} / {total}</span>
        <span>{question.isSingleChoice ? 'Chọn 1 đáp án' : 'Có thể chọn nhiều đáp án'}</span>
      </div>
      <p className="text-lg font-medium text-foreground leading-relaxed">{question.statement}</p>
      <div className="space-y-3">
        {question.choices.map((choice, i) => {
          const isSelected = selected.includes(i);
          return (
            <button key={i} onClick={() => toggle(i)}
              className={`w-full rounded-lg border-2 p-4 text-left text-sm transition-all duration-150 ${
                isSelected
                  ? 'border-primary bg-primary/10 font-medium text-primary'
                  : 'border-border hover:border-muted-foreground hover:bg-muted/50'
              }`}>
              <span className="mr-3 font-bold">{String.fromCharCode(65 + i)}.</span>
              {choice}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 🔵 Tuấn (FE Dev 2)

### `TestResultScreen`
```tsx
export function TestResultScreen({ result }: { result: TestResultResponse }) {
  const passed = result.percent >= 50;

  return (
    <PageShell className="max-w-2xl">
      {/* Score summary */}
      <div className={`rounded-2xl p-8 text-center mb-8 ${passed
        ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
        : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'}`}>
        <p className={`text-6xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
          {result.percent}%
        </p>
        <p className="text-lg font-medium">{passed ? '🎉 Chúc mừng bạn đã vượt qua!' : '😔 Chưa đạt. Hãy thử lại!'}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {result.earnedPoints} / {result.totalPoints} điểm
        </p>
      </div>

      {/* Per-question breakdown */}
      <h3 className="font-semibold mb-4">Chi tiết từng câu</h3>
      <div className="space-y-3">
        {result.items.map((item, i) => {
          const correct = item.earned > 0;
          return (
            <Card key={item.questionId} className={`border-l-4 ${correct ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <CardContent className="py-3 px-4">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium">Câu {i + 1}</p>
                  <Badge variant={correct ? 'default' : 'destructive'}>
                    {correct ? `+${item.earned}đ` : '0đ'}
                  </Badge>
                </div>
                {!correct && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>Đáp án của bạn: <span className="text-foreground">{item.givenAnswer || '(bỏ trống)'}</span></p>
                    <p>Đáp án đúng: <span className="text-green-600 font-medium">
                      {item.correctChoices.map(i => String.fromCharCode(65 + i)).join(', ')}
                    </span></p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button className="mt-6 w-full" variant="outline" onClick={() => history.back()}>
        Quay lại bài học
      </Button>
    </PageShell>
  );
}
```

---

## ✅ End-of-Day Checklist

- [ ] `POST /api/tests/{id}/sessions` creates session; second call returns existing active session
- [ ] `PUT /api/sessions/{id}/answers` upserts correctly (no duplicate rows)
- [ ] `POST /api/sessions/{id}/submit` marks `is_done=true` and returns scored result
- [ ] Calling submit on an already-done session returns 409
- [ ] Score calculation: all-or-nothing per question, correct percentage computed
- [ ] Test page: countdown timer counts down, auto-submits at zero
- [ ] Selecting an answer saves immediately to backend
- [ ] Result screen shows per-question correct/incorrect with correct answer revealed
- [ ] Dark mode correct on all test UI
