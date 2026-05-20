# Day 7 — Lesson Viewer & Completion

**Goal**: Students can watch video lessons (YouTube/Vimeo embed) and read blog lessons (rendered Markdown). Completing a lesson marks it done and updates progress.
**Done when**: All three lesson types render correctly for enrolled students. "Đánh dấu hoàn thành" button persists to DB.

---

## 🔴 Trung (BE Lead)

### Task 1 — Save video lesson content
`PUT /api/lessons/{id}/video`:
```java
@PutMapping("/{id}/video")
public ResponseEntity<Void> updateVideo(
    @PathVariable Long id,
    @Valid @RequestBody UpdateVideoRequest req,
    Authentication auth) {
  lessonService.assertIsInstructorOfLesson(id, getCurrentUserId(auth));
  lessonVideoRepo.findById(id).ifPresentOrElse(v -> {
    v.setProvider(req.provider());
    v.setProviderValue(req.providerValue());
    v.setUpdatedAt(Instant.now());
    lessonVideoRepo.save(v);
  }, () -> {
    LessonVideoEntity v = new LessonVideoEntity();
    v.setId(id);
    v.setProvider(req.provider());
    v.setProviderValue(req.providerValue());
    v.setCreatedAt(Instant.now()); v.setUpdatedAt(Instant.now());
    lessonVideoRepo.save(v);
  });
  return ResponseEntity.noContent().build();
}

public record UpdateVideoRequest(
    @NotNull VideoProvider provider,
    @NotBlank String providerValue) {}

public enum VideoProvider { youtube, vimeo, uploaded }
```

### Task 2 — Save blog lesson content
`PUT /api/lessons/{id}/blog`:
```java
public record UpdateBlogRequest(@NotNull String content) {}

// Same pattern: upsert into lesson_blogs table
```

### Task 3 — Lesson completion
`POST /api/lessons/{id}/complete`:
```java
@PostMapping("/{id}/complete")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<Void> markComplete(@PathVariable Long id, Authentication auth) {
  Long userId = getCurrentUserId(auth);
  LessonEntity lesson = lessonRepo.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  // Must be enrolled in the course
  Long courseId = moduleRepo.findById(lesson.getModuleId())
      .map(ModuleEntity::getCourseId).orElseThrow();
  if (!enrollmentRepo.existsById(new EnrollmentId(userId, courseId)))
    return ResponseEntity.status(403).build();

  LessonCompletionId cid = new LessonCompletionId(id, userId);
  if (!completionRepo.existsById(cid)) {
    LessonCompletionEntity comp = new LessonCompletionEntity();
    comp.setId(cid);
    comp.setCreatedAt(Instant.now()); comp.setUpdatedAt(Instant.now());
    completionRepo.save(comp);
  }
  return ResponseEntity.status(201).build();
}
```

### Task 4 — `GET /api/courses/{id}/progress`
```java
@GetMapping("/{id}/progress")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<ProgressResponse> getProgress(
    @PathVariable Long id, Authentication auth) {
  Long userId = getCurrentUserId(auth);
  long total = lessonRepo.countByCourseId(id);
  long completed = completionRepo.countByUserIdAndCourseId(userId, id);
  int percent = total == 0 ? 0 : (int) (completed * 100 / total);
  return ResponseEntity.ok(new ProgressResponse(completed, total, percent));
}

public record ProgressResponse(long completedLessons, long totalLessons, int percent) {}
```

---

## 🔴 Anh (BE Dev / PM)

### Task 1 — Lesson resources
`POST /api/lessons/{id}/resources` — attach a file (by `fileId`) to a lesson:
```java
@PostMapping("/{id}/resources")
public ResponseEntity<Void> addResource(@PathVariable Long id,
    @RequestBody Map<String, Long> body, Authentication auth) {
  Long fileId = body.get("fileId");
  lessonService.assertIsInstructorOfLesson(id, getCurrentUserId(auth));
  LessonResourceEntity r = new LessonResourceEntity();
  r.setId(idGenerator.nextId());
  r.setLessonId(id); r.setFileId(fileId);
  r.setCreatedAt(Instant.now()); r.setUpdatedAt(Instant.now());
  resourceRepo.save(r);
  return ResponseEntity.status(201).build();
}
```

`GET /api/lessons/{id}/resources` — returns list of `FileResponse`

`DELETE /api/lessons/{id}/resources/{resourceId}` — instructor only

Same pattern for course resources (`/api/courses/{id}/resources`).

### Task 2 — Integration tests for lesson completion
- Mark lesson complete (enrolled user) → 201
- Mark again (idempotent) → 201 (no duplicate row)
- Non-enrolled user marks complete → 403
- Verify progress endpoint returns correct percent

---

## 🔵 Vinh (FE Lead)

### Lesson Page — container
File: `src/pages/lessons/LessonPage.tsx`

```tsx
export function LessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const [lesson, setLesson] = useState<LessonDetailResponse | null>(null);
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<LessonDetailResponse>(`/api/lessons/${lessonId}`),
      api.get<ModuleDto[]>(`/api/courses/${courseId}/modules`),
    ]).then(([lessonRes, modulesRes]) => {
      setLesson(lessonRes.data);
      setModules(modulesRes.data);
      const l = modulesRes.data.flatMap(m => m.lessons).find(l => l.id === Number(lessonId));
      setIsCompleted(l?.isCompleted ?? false);
    }).finally(() => setLoading(false));
  }, [lessonId, courseId]);

  const markComplete = async () => {
    setCompleting(true);
    await api.post(`/api/lessons/${lessonId}/complete`);
    setIsCompleted(true);
    setCompleting(false);
    toast.success('Đã đánh dấu hoàn thành!');
  };

  if (loading) return <div className="flex gap-6 p-6"><Skeleton className="flex-1 h-96"/><Skeleton className="w-72 h-96"/></div>;
  if (!lesson) return <p>Không tìm thấy bài học.</p>;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-72 shrink-0 border-r border-border lg:block overflow-y-auto p-4">
        <ModuleSidebar modules={modules} courseId={Number(courseId)} />
      </aside>
      {/* Content */}
      <main className="flex-1 p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{lesson.title}</h1>
        {lesson.lessonType === 'video' && lesson.video && <VideoLessonViewer video={lesson.video} />}
        {lesson.lessonType === 'blog'  && lesson.blog  && <BlogLessonViewer  blog={lesson.blog}   />}
        {lesson.lessonType === 'test'  && lesson.test  && <TestLessonEntry  test={lesson.test}   />}

        <div className="mt-8 flex items-center gap-4">
          {isCompleted ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={20}/> <span className="font-medium">Đã hoàn thành</span>
            </div>
          ) : (
            <Button id="btn-mark-complete" onClick={markComplete} disabled={completing}>
              {completing && <Loader2 size={16} className="animate-spin mr-2"/>}
              Đánh dấu hoàn thành
            </Button>
          )}
          <LessonNavButtons modules={modules} currentLessonId={Number(lessonId)} courseId={Number(courseId)} />
        </div>
      </main>
    </div>
  );
}
```

### Video Lesson Viewer
```tsx
export function VideoLessonViewer({ video }: { video: { provider: string; providerValue: string } }) {
  const embedUrl = video.provider === 'youtube'
    ? `https://www.youtube.com/embed/${video.providerValue}`
    : `https://player.vimeo.com/video/${video.providerValue}`;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl shadow-lg bg-black">
      <iframe
        src={embedUrl}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video lesson"
      />
    </div>
  );
}
```

### Video Lesson Edit Page (instructor)
```tsx
// src/pages/instructor/VideoLessonEditPage.tsx
export function VideoLessonEditPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [provider, setProvider] = useState<'youtube' | 'vimeo'>('youtube');
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await api.put(`/api/lessons/${lessonId}/video`, { provider, providerValue: value });
    setSaving(false);
    toast.success('Đã lưu!');
  };

  const previewUrl = value
    ? provider === 'youtube'
      ? `https://www.youtube.com/embed/${value}`
      : `https://player.vimeo.com/video/${value}`
    : null;

  return (
    <PageShell>
      <SectionHeader title="Chỉnh sửa bài video" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <Label>Nền tảng video</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as 'youtube' | 'vimeo')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="vimeo">Vimeo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Video ID</Label>
            <Input placeholder={provider === 'youtube' ? 'e.g. dQw4w9WgXcQ' : 'e.g. 123456789'}
              value={value} onChange={e => setValue(e.target.value)} />
            <p className="mt-1 text-xs text-muted-foreground">
              {provider === 'youtube' ? 'Lấy từ URL: youtube.com/watch?v=VIDEO_ID' : 'Lấy từ URL: vimeo.com/VIDEO_ID'}
            </p>
          </div>
          <Button onClick={save} disabled={saving || !value}>Lưu</Button>
        </div>
        {/* Preview */}
        <div className="aspect-video overflow-hidden rounded-xl bg-muted flex items-center justify-center">
          {previewUrl
            ? <iframe src={previewUrl} className="h-full w-full" allowFullScreen title="Preview" />
            : <p className="text-muted-foreground text-sm">Nhập Video ID để xem trước</p>}
        </div>
      </div>
    </PageShell>
  );
}
```

---

## 🔵 Sâm (FE Dev 1)

### Blog Lesson Viewer (Markdown)
Install a markdown renderer: `pnpm add react-markdown`

```tsx
import ReactMarkdown from 'react-markdown';

export function BlogLessonViewer({ blog }: { blog: { content: string } }) {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown>{blog.content}</ReactMarkdown>
    </article>
  );
}
```

### Blog Lesson Edit Page (instructor)
```tsx
export function BlogLessonEditPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState(false);

  const save = async () => {
    await api.put(`/api/lessons/${lessonId}/blog`, { content });
    toast.success('Đã lưu!');
  };

  return (
    <PageShell>
      <SectionHeader title="Chỉnh sửa bài viết"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreview(p => !p)}>
              {preview ? 'Chỉnh sửa' : 'Xem trước'}
            </Button>
            <Button onClick={save}>Lưu</Button>
          </div>
        } />
      {preview
        ? <BlogLessonViewer blog={{ content }} />
        : <Textarea className="min-h-[500px] font-mono text-sm" value={content}
            onChange={e => setContent(e.target.value)} placeholder="Viết nội dung bằng Markdown..." />
      }
    </PageShell>
  );
}
```

### `LessonNavButtons` (prev/next lesson)
```tsx
export function LessonNavButtons({ modules, currentLessonId, courseId }: {
  modules: ModuleDto[]; currentLessonId: number; courseId: number;
}) {
  const allLessons = modules.flatMap(m => m.lessons);
  const idx = allLessons.findIndex(l => l.id === currentLessonId);
  const prev = idx > 0 ? allLessons[idx - 1] : null;
  const next = idx < allLessons.length - 1 ? allLessons[idx + 1] : null;

  return (
    <div className="flex gap-2 ml-auto">
      {prev && <Button variant="outline" asChild><Link to={ROUTES.LESSON(courseId, prev.id)}>← Bài trước</Link></Button>}
      {next && <Button asChild><Link to={ROUTES.LESSON(courseId, next.id)}>Bài tiếp →</Link></Button>}
    </div>
  );
}
```

### `LessonResourceList`
```tsx
export function LessonResourceList({ lessonId }: { lessonId: number }) {
  const [resources, setResources] = useState<FileDto[]>([]);
  useEffect(() => {
    api.get<FileDto[]>(`/api/lessons/${lessonId}/resources`).then(r => setResources(r.data));
  }, [lessonId]);
  if (resources.length === 0) return null;
  return (
    <div className="mt-6 border-t border-border pt-4">
      <h4 className="mb-3 font-semibold text-sm">Tài liệu kèm theo</h4>
      <div className="space-y-2">
        {resources.map(f => (
          <a key={f.id} href={f.providerValue} target="_blank" rel="noopener"
            className="flex items-center gap-2 text-sm text-primary hover:underline">
            <Download size={14}/> {f.providerValue.split('/').pop()}
          </a>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔵 Tuấn (FE Dev 2)

### `<ProgressBar>` component
```tsx
export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="space-y-1">
      {label && <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span><span>{value}%</span>
      </div>}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
```

### `TestLessonEntry` stub (routes to test page)
```tsx
export function TestLessonEntry({ test }: { test: { testId: number; statement: string; timeLimit: number } }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-border p-8 text-center space-y-4">
      <ClipboardList size={40} className="mx-auto text-muted-foreground" />
      <p className="text-lg font-semibold">{test.statement}</p>
      <p className="text-sm text-muted-foreground">Thời gian: {Math.floor(test.timeLimit / 60)} phút</p>
      <Button asChild id="btn-start-test">
        <Link to={`/tests/${test.testId}`}>Bắt đầu làm bài</Link>
      </Button>
    </div>
  );
}
```

---

## ✅ End-of-Day Checklist

- [ ] `PUT /api/lessons/{id}/video` saves YouTube/Vimeo ID to `lesson_videos` table
- [ ] `PUT /api/lessons/{id}/blog` saves markdown content to `lesson_blogs` table
- [ ] `POST /api/lessons/{id}/complete` creates row in `lesson_completions` (idempotent)
- [ ] `GET /api/courses/{id}/progress` returns correct `{ completedLessons, totalLessons, percent }`
- [ ] Video lesson: YouTube/Vimeo iframe renders responsively at 16:9
- [ ] Blog lesson: Markdown renders with proper typography (headings, code, lists)
- [ ] "Đánh dấu hoàn thành" button updates to green checkmark after click
- [ ] Prev/Next lesson buttons navigate correctly across module boundaries
