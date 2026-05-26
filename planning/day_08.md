# Day 8 — Question Bank & Test Builder

**Goal**: Instructors can create questions in a reusable bank and assemble them into tests with point values and ordering.
**Done when**: Instructor can create a multiple-choice question, create a test lesson, and add questions to the test with points.

---

## 🔴 Trung (BE Lead)

### Question CRUD
`QuestionEntity.java`:
```java
@Entity @Table(name = "questions")
public class QuestionEntity {
  @Id private Long id;
  @Column(nullable = false) private String statement;
  @Column(name = "author_id") private Long authorId;
  @Enumerated(EnumType.STRING) @Column(name = "question_type") private QuestionType questionType;
  private Instant createdAt; private Instant updatedAt;
}
public enum QuestionType { multiple_choice }
```

`McQuestionEntity.java`:
```java
@Entity @Table(name = "mc_questions")
public class McQuestionEntity {
  @Id private Long id;                         // same as question id
  @Column(columnDefinition = "text[]") private String[] choices;
  @Column(name = "correct_choices", columnDefinition = "int[]") private int[] correctChoices;
  @Column(name = "is_single_choice") private boolean isSingleChoice;
  private Instant createdAt; private Instant updatedAt;
}
```

`POST /api/questions`:
```java
@PostMapping
@PreAuthorize("@permissionService.hasPermission(#auth.principal.id, T(com.goctrithuc.shared.Permission).MANAGE_OWN_QUESTIONS)")
public ResponseEntity<QuestionResponse> createQuestion(
    @Valid @RequestBody CreateQuestionRequest req, Authentication auth) {
  Long authorId = getCurrentUserId(auth);
  // ID is assigned by DB via DEFAULT generate_snowflake_id() — do not set manually

  QuestionEntity q = new QuestionEntity();
  q.setStatement(req.statement());
  q.setAuthorId(authorId); q.setQuestionType(QuestionType.multiple_choice);
  q.setCreatedAt(Instant.now()); q.setUpdatedAt(Instant.now());
  questionRepo.save(q);

  McQuestionEntity mc = new McQuestionEntity();
  mc.setId(qId);
  mc.setChoices(req.choices().toArray(new String[0]));
  mc.setCorrectChoices(req.correctChoices().stream().mapToInt(Integer::intValue).toArray());
  mc.setSingleChoice(req.isSingleChoice());
  mc.setCreatedAt(Instant.now()); mc.setUpdatedAt(Instant.now());
  mcQuestionRepo.save(mc);

  return ResponseEntity.status(201).body(QuestionResponse.fromInstructor(q, mc));
}

public record CreateQuestionRequest(
    @NotBlank String statement,
    @Size(min = 2, max = 6) List<@NotBlank String> choices,
    @NotEmpty List<Integer> correctChoices,
    boolean isSingleChoice) {}

// Note: The controller/validator must strictly verify that all indices in `correctChoices` are >= 0 and < choices.size() to prevent ArrayIndexOutOfBoundsException in the scoring engine.
```

`GET /api/questions` (paginated, filter by `authorId`):
```java
@GetMapping
@PreAuthorize("isAuthenticated()")
public ResponseEntity<Page<QuestionResponse>> listQuestions(
    @RequestParam(required = false) Long authorId,
    @RequestParam(required = false) String search,
    Pageable pageable, Authentication auth) {
  Long userId = getCurrentUserId(auth);
  // Instructors see their own questions; admins (ADMIN bit) see all
  Long filterAuthor = permissionService.hasPermission(userId, Permission.ADMIN)
      ? authorId : userId;
  return ResponseEntity.ok(
      questionService.list(filterAuthor, search, pageable)
          .map(pair -> QuestionResponse.fromInstructor(pair.first(), pair.second())));
}
```

`PUT /api/questions/{id}` — update statement, choices, correctChoices
`DELETE /api/questions/{id}` — **hard-delete**: permanently removes the question and its mc_question rows from the database.
  Deletion cascades to `test_question` and `test_session_answers` (removing the question from all tests and past/active attempts).
  Dynamic score calculations will exclude the deleted question on-the-fly.

### Test lesson management
`POST /api/tests/{testId}/questions` — add question to test:
```java
public record AddQuestionRequest(
    @NotNull Long questionId,
    @NotNull Integer order,
    Double point) {}

@PostMapping("/{testId}/questions")
public ResponseEntity<Void> addQuestion(
    @PathVariable Long testId,
    @Valid @RequestBody AddQuestionRequest req, Authentication auth) {
  lessonService.assertIsInstructorOfTest(testId, getCurrentUserId(auth));
  TestQuestionEntity tq = new TestQuestionEntity();
  tq.setTestId(testId); tq.setQuestionId(req.questionId());
  tq.setOrder(req.order()); tq.setPoint(req.point());
  tq.setCreatedAt(Instant.now()); tq.setUpdatedAt(Instant.now());
  testQuestionRepo.save(tq);
  return ResponseEntity.status(201).build();
}
```

`DELETE /api/tests/{testId}/questions/{questionId}` — remove from test

`GET /api/tests/{testId}/questions`:
- For **instructors/admins**: returns full `McQuestionInstructorDto` including `correctChoices`
- For **students**: returns `McQuestionStudentDto` — **omit `correctChoices`**

```java
public ResponseEntity<List<QuestionResponse>> getTestQuestions(
    @PathVariable Long testId, Authentication auth) {
  Long userId = getCurrentUserId(auth);
  // Gate on MANAGE_OWN_QUESTIONS bit: any teacher or admin sees correct_choices
  boolean isInstructor = permissionService.hasPermission(userId, Permission.MANAGE_OWN_QUESTIONS);

  // Single JOIN query — avoids N+1 (no per-question findById loop)
  List<TestQuestionWithDetails> rows = testQuestionRepo.findWithDetails(testId);
  return ResponseEntity.ok(rows.stream().map(row ->
      isInstructor
          ? QuestionResponse.fromInstructor(row.question(), row.mcQuestion())
          : QuestionResponse.fromStudent(row.question(), row.mcQuestion())
  ).toList());
}
```

---

## 🔴 Anh (BE Dev / PM)

### Test CRUD
`LessonTestEntity.java`:
```java
@Entity @Table(name = "lesson_tests")
public class LessonTestEntity {
  @Id private Long id;      // same as lesson id
  @Column(nullable = false) private String statement;
  private String settings;
  @Column(name = "time_limit") private int timeLimit; // seconds
  private Instant createdAt; private Instant updatedAt;
}
```

`PUT /api/lessons/{id}/test` — update test settings (statement, timeLimit):
```java
public record UpdateTestRequest(
    @NotBlank String statement,
    @Min(60) @Max(10800) int timeLimit,
    String settings) {}
```

> **Note**: `statement` and `time_limit` are now required at lesson creation time (both columns are `NOT NULL`).
> When creating a lesson of type `test`, the creation request must include `statement` and `timeLimit`.
> There is no "create empty then fill later" pattern — use this endpoint only for subsequent edits.

`GET /api/tests/{testId}` — returns test info (statement, timeLimit) for the test page.

Unit tests for score calculation:
```java
@Test void singleChoiceCorrect() {
  // Given mc question with correctChoices=[1], answer="1"
  assertEquals(10.0, scoreService.scoreAnswer(mc, "1", 10.0));
}
@Test void singleChoiceWrong() {
  assertEquals(0.0, scoreService.scoreAnswer(mc, "0", 10.0));
}
@Test void multiChoicePartialCredit() {
  // policy: all-or-nothing for multi-choice
  assertEquals(0.0, scoreService.scoreAnswer(mcMulti, "0,1", 10.0)); // only 0 is correct
}
```

---

## 🔵 Vinh (FE Lead)

### Test Builder page
File: `src/pages/instructor/TestBuilderPage.tsx`

```tsx
export function TestBuilderPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [testId, setTestId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<TestQuestionItem[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [statement, setStatement] = useState('');
  const [timeLimit, setTimeLimit] = useState(1800); // 30 min default

  useEffect(() => {
    api.get<LessonDetailResponse>(`/api/lessons/${lessonId}`).then(r => {
      if (r.data.test) {
        setTestId(r.data.test.testId);
        setStatement(r.data.test.statement);
        setTimeLimit(r.data.test.timeLimit);
        return api.get<TestQuestionItem[]>(`/api/tests/${r.data.test.testId}/questions`);
      }
    }).then(r => r && setQuestions(r.data));
  }, [lessonId]);

  const saveSettings = async () => {
    await api.put(`/api/lessons/${lessonId}/test`, { statement, timeLimit });
    toast.success('Đã lưu cài đặt bài kiểm tra');
  };

  const removeQuestion = async (questionId: string) => {
    await api.delete(`/api/tests/${testId}/questions/${questionId}`);
    setQuestions(q => q.filter(x => x.id !== questionId));
  };

  return (
    <PageShell>
      <SectionHeader title="Thiết lập bài kiểm tra" />
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Settings panel */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Cài đặt</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Đề bài / Hướng dẫn</Label>
              <Textarea rows={3} value={statement} onChange={e => setStatement(e.target.value)} />
            </div>
            <div>
              <Label>Thời gian làm bài</Label>
              <Select value={String(timeLimit)} onValueChange={v => setTimeLimit(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="900">15 phút</SelectItem>
                  <SelectItem value="1800">30 phút</SelectItem>
                  <SelectItem value="2700">45 phút</SelectItem>
                  <SelectItem value="3600">60 phút</SelectItem>
                  <SelectItem value="5400">90 phút</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={saveSettings}>Lưu cài đặt</Button>
          </CardContent>
        </Card>
        {/* Question list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Câu hỏi ({questions.length})</h3>
            <Button variant="outline" onClick={() => setShowPicker(true)}>
              <Plus size={16}/> Thêm câu hỏi
            </Button>
          </div>
          {questions.length === 0
            ? <EmptyState title="Chưa có câu hỏi" description="Thêm câu hỏi từ ngân hàng đề" />
            : questions.map((q, i) => (
              <TestQuestionItem key={q.id} question={q} index={i}
                onRemove={() => removeQuestion(q.id)} />
            ))}
        </div>
      </div>
      <QuestionPickerModal open={showPicker} onClose={() => setShowPicker(false)}
        testId={testId!} onAdded={(q) => setQuestions(prev => [...prev, q])} />
    </PageShell>
  );
}
```

---

## 🔵 Sâm (FE Dev 1)

### `QuestionForm` — create/edit a question
File: `src/pages/instructor/_components/QuestionForm.tsx`

```tsx
export function QuestionForm({ onSaved }: { onSaved: (q: QuestionDto) => void }) {
  const [statement, setStatement] = useState('');
  const [choices, setChoices] = useState(['', '']);
  const [correctChoices, setCorrectChoices] = useState<number[]>([]);
  const [isSingleChoice, setIsSingleChoice] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleCorrect = (idx: number) => {
    if (isSingleChoice) setCorrectChoices([idx]);
    else setCorrectChoices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const addChoice = () => setChoices(prev => [...prev, '']);
  const removeChoice = (idx: number) => {
    setChoices(prev => prev.filter((_, i) => i !== idx));
    setCorrectChoices(prev => prev.filter(i => i !== idx).map(i => i > idx ? i - 1 : i));
  };

  const submit = async () => {
    setSaving(true); setErrors({});
    try {
      const res = await api.post<QuestionDto>('/api/questions', {
        statement, choices, correctChoices, isSingleChoice,
      });
      onSaved(res.data);
      toast.success('Đã tạo câu hỏi');
      setStatement(''); setChoices(['', '']); setCorrectChoices([]);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) setErrors(err.response?.data?.errors ?? {});
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Câu hỏi *</Label>
        <Textarea rows={2} value={statement} onChange={e => setStatement(e.target.value)} />
        {errors.statement && <p className="text-xs text-destructive mt-1">{errors.statement}</p>}
      </div>
      <div className="flex items-center gap-3">
        <Switch id="single" checked={isSingleChoice} onCheckedChange={setIsSingleChoice} />
        <Label htmlFor="single">Một đáp án đúng</Label>
      </div>
      <div className="space-y-2">
        <Label>Đáp án (chọn đáp án đúng)</Label>
        {choices.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type={isSingleChoice ? 'radio' : 'checkbox'}
              checked={correctChoices.includes(i)} onChange={() => toggleCorrect(i)}
              className="accent-primary" />
            <Input value={c} onChange={e => {
              const next = [...choices]; next[i] = e.target.value; setChoices(next);
            }} placeholder={`Đáp án ${i + 1}`} />
            {choices.length > 2 && (
              <Button variant="ghost" size="icon" onClick={() => removeChoice(i)}>
                <X size={14}/>
              </Button>
            )}
          </div>
        ))}
        {choices.length < 6 && (
          <Button variant="ghost" size="sm" onClick={addChoice}><Plus size={14}/> Thêm đáp án</Button>
        )}
      </div>
      <Button onClick={submit} disabled={saving || correctChoices.length === 0}>
        {saving && <Loader2 size={16} className="animate-spin mr-2"/>} Lưu câu hỏi
      </Button>
    </div>
  );
}
```

### Question Bank page
`src/pages/instructor/QuestionBankPage.tsx` — shows paginated list of instructor's questions, each with edit/delete buttons, and a "Tạo câu hỏi mới" panel at the top.

---

## 🔵 Tuấn (FE Dev 2)

### `QuestionPickerModal` — search and add questions to test
```tsx
export function QuestionPickerModal({ open, onClose, testId, onAdded }: {
  open: boolean; onClose: () => void; testId: string; onAdded: (q: TestQuestionItem) => void;
}) {
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (open) api.get<PageResponse<QuestionDto>>('/api/questions', { params: { search, size: 20 } })
      .then(r => setQuestions(r.data.content));
  }, [open, search]);

  const add = async (q: QuestionDto) => {
    setAdding(q.id);
    await api.post(`/api/tests/${testId}/questions`, { questionId: q.id, order: 999, point: 1 });
    onAdded({ ...q, point: 1 });
    setAdding(null);
    toast.success('Đã thêm câu hỏi');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Chọn câu hỏi</DialogTitle></DialogHeader>
        <Input placeholder="Tìm câu hỏi..." value={search}
          onChange={e => setSearch(e.target.value)} />
        <div className="max-h-96 overflow-y-auto space-y-2 mt-2">
          {questions.map(q => (
            <div key={q.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
              <p className="flex-1 text-sm">{q.statement}</p>
              <Button size="sm" onClick={() => add(q)} disabled={adding === q.id}>
                {adding === q.id ? <Loader2 size={14} className="animate-spin"/> : <Plus size={14}/>}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### `TestQuestionItem` — displays one question in the test builder with point editing
```tsx
export function TestQuestionItem({ question, index, onRemove }: {
  question: TestQuestionItem; index: number; onRemove: () => void;
}) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <span className="text-sm font-bold text-muted-foreground w-6">{index + 1}</span>
      <p className="flex-1 text-sm">{question.statement}</p>
      <div className="flex items-center gap-2">
        <Label className="text-xs">Điểm</Label>
        <Input type="number" min={0} className="w-16 h-7 text-sm" defaultValue={question.point ?? 1} />
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove}>
        <Trash2 size={14} className="text-destructive"/>
      </Button>
    </Card>
  );
}
```

---

## ✅ End-of-Day Checklist

- [ ] `POST /api/questions` creates question + mc_question rows
- [ ] `GET /api/tests/{id}/questions` omits `correctChoices` for student role
- [ ] `POST /api/tests/{id}/questions` adds question with order + point
- [ ] Test Builder page shows settings panel + question list
- [ ] QuestionForm validates: at least 2 choices, at least 1 correct answer selected
- [ ] QuestionPickerModal searches the question bank and adds to test
- [ ] Question Bank page lists instructor's questions with edit/delete
