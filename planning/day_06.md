# Day 6 — Modules & Lesson Editor

**Goal**: Instructors can create, edit, delete and reorder modules and lessons within a course.
**Done when**: Course editor page shows modules with lessons; add/delete/reorder all work.

---

## 🔴 Trung (BE Lead)

### Module CRUD
`POST /api/courses/{id}/modules` — create module
```java
@PostMapping("/{courseId}/modules")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<ModuleResponse> createModule(
    @PathVariable Long courseId,
    @Valid @RequestBody CreateModuleRequest req,
    Authentication auth) {
  Long userId = getCurrentUserId(auth);
  CourseEntity course = courseRepo.findById(courseId)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  if (!course.getAuthorId().equals(userId) &&
      !permissionService.hasPermission(userId, Permission.EDIT_ANY_COURSE))
    return ResponseEntity.status(403).build();

  int nextOrder = moduleRepo.countByCourseId(courseId);
  ModuleEntity m = new ModuleEntity();
  m.setId(idGenerator.nextId());
  m.setCourseId(courseId);
  m.setTitle(req.title());
  m.setOrder(nextOrder);
  m.setCreatedAt(Instant.now()); m.setUpdatedAt(Instant.now());
  return ResponseEntity.status(201).body(ModuleResponse.from(moduleRepo.save(m)));
}

public record CreateModuleRequest(@NotBlank @Size(max = 200) String title) {}
```

`PUT /api/modules/{id}` — update title
`DELETE /api/modules/{id}` — delete (cascade to lessons)
`PATCH /api/modules/{id}/order` — update order field:
```java
@PatchMapping("/{id}/order")
public ResponseEntity<Void> reorderModule(@PathVariable Long id,
    @RequestBody Map<String, Integer> body, Authentication auth) {
  moduleService.reorder(id, body.get("order"), getCurrentUserId(auth));
  return ResponseEntity.noContent().build();
}
```

### Lesson CRUD
`POST /api/modules/{id}/lessons`:
```java
public record CreateLessonRequest(
    @NotBlank String title,
    @NotNull LessonType lessonType) {}
```

On create, also create the sub-entity:
- `lessonType == video` → insert empty row in `lesson_videos`
- `lessonType == blog`  → insert empty row in `lesson_blogs` (`content = ""`)
- `lessonType == test`  → insert row in `lesson_tests` (requires `statement`, `timeLimit`)

`PUT /api/lessons/{id}` — update title only (content is updated separately by Day 7)
`DELETE /api/lessons/{id}` — delete lesson + sub-entity
`PATCH /api/lessons/{id}/order` — same pattern as module reorder

### Integration tests
- Create module as course author → 201
- Create module as non-owner → 403
- Delete module → lessons in that module also deleted (cascade)
- Reorder modules — order value updated in DB

---

## 🔴 Anh (BE Dev / PM)

### Task 1 — `GET /api/lessons/{id}` (content included)
```java
@GetMapping("/{id}")
public ResponseEntity<LessonDetailResponse> getLesson(
    @PathVariable Long id, Authentication auth) {
  LessonEntity lesson = lessonRepo.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  // Access check: must be enrolled in the course or be the author/admin
  lessonService.assertCanAccess(lesson, auth);
  return ResponseEntity.ok(lessonService.buildDetailResponse(lesson, auth));
}
```

`LessonDetailResponse` union type — include the correct sub-entity based on `lessonType`:
```java
public record LessonDetailResponse(
    Long id, String title, LessonType lessonType, int order,
    // Only one of these will be non-null
    VideoContent video,
    BlogContent blog,
    TestContent test) {

  public record VideoContent(String providerValue, VideoProvider provider) {}
  public record BlogContent(String content) {}
  public record TestContent(Long testId, String statement, int timeLimit) {}
}
```

### Task 2 — Write reorder service helper
```java
// Reorders all siblings after target to keep order contiguous
@Transactional
public void reorderModules(Long courseId, Long moduleId, int newOrder) {
  List<ModuleEntity> siblings = moduleRepo.findByCourseIdOrderByOrder(courseId);
  ModuleEntity target = siblings.stream().filter(m -> m.getId().equals(moduleId))
      .findFirst().orElseThrow();
  siblings.remove(target);
  siblings.add(Math.min(newOrder, siblings.size()), target);
  for (int i = 0; i < siblings.size(); i++) {
    siblings.get(i).setOrder(i);
  }
  moduleRepo.saveAll(siblings);
}
```

Same pattern for lesson reorder within a module.

---

## 🔵 Vinh (FE Lead)

### Course Editor page
File: `src/pages/instructor/CourseEditPage.tsx`

Layout: left sidebar = module list; right panel = selected lesson editor form.

```tsx
export function CourseEditPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const res = await api.get<ModuleDto[]>(`/api/courses/${courseId}/modules`);
    setModules(res.data);
  };

  useEffect(() => { reload().finally(() => setLoading(false)); }, [courseId]);

  const addModule = async () => {
    const title = prompt('Tên module:');
    if (!title) return;
    await api.post(`/api/courses/${courseId}/modules`, { title });
    reload();
  };

  return (
    <PageShell>
      <SectionHeader title="Chỉnh sửa khóa học"
        action={<Button onClick={addModule}><Plus size={16}/> Thêm module</Button>} />
      {loading ? <SkeletonList count={4} /> : (
        <div className="space-y-3">
          {modules.map((mod) => (
            <ModuleAccordion key={mod.id} module={mod} courseId={Number(courseId)} onReload={reload} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
```

### `ModuleAccordion`
File: `src/pages/instructor/_components/ModuleAccordion.tsx`

```tsx
export function ModuleAccordion({ module, courseId, onReload }: {
  module: ModuleDto; courseId: number; onReload: () => void;
}) {
  const [open, setOpen] = useState(true);

  const deleteModule = async () => {
    if (!confirm(`Xóa module "${module.title}"?`)) return;
    await api.delete(`/api/modules/${module.id}`);
    onReload();
  };

  const addLesson = async (lessonType: LessonDto['lessonType']) => {
    const title = prompt('Tên bài học:');
    if (!title) return;
    await api.post(`/api/modules/${module.id}/lessons`, { title, lessonType });
    onReload();
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between py-3">
        <button className="flex items-center gap-2 font-semibold" onClick={() => setOpen(o => !o)}>
          <ChevronDown size={16} className={`transition-transform ${open ? '' : '-rotate-90'}`}/>
          {module.title}
        </button>
        <div className="flex gap-1">
          <LessonTypeMenu onSelect={addLesson} />
          <Button variant="ghost" size="icon" onClick={deleteModule}>
            <Trash2 size={14} className="text-destructive"/>
          </Button>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0 space-y-1">
          {module.lessons.length === 0 && (
            <p className="text-sm text-muted-foreground px-2">Chưa có bài học. Thêm bài học bên trên.</p>
          )}
          {module.lessons.map((lesson) => (
            <LessonRow key={lesson.id} lesson={lesson} onReload={onReload} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}
```

---

## 🔵 Sâm (FE Dev 1)

### `LessonRow` with drag handle
```tsx
export function LessonRow({ lesson, onReload }: { lesson: LessonDto; onReload: () => void }) {
  const icons = { video: Video, blog: FileText, test: ClipboardList };
  const Icon = icons[lesson.lessonType];

  const deleteLesson = async () => {
    if (!confirm(`Xóa "${lesson.title}"?`)) return;
    await api.delete(`/api/lessons/${lesson.id}`);
    onReload();
  };

  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted group">
      <GripVertical size={14} className="text-muted-foreground cursor-grab" />
      <Icon size={14} className="text-muted-foreground shrink-0" />
      <span className="flex-1 text-sm">{lesson.title}</span>
      <div className="hidden gap-1 group-hover:flex">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/instructor/lessons/${lesson.id}/edit`}><Pencil size={12}/></Link>
        </Button>
        <Button variant="ghost" size="icon" onClick={deleteLesson}>
          <Trash2 size={12} className="text-destructive"/>
        </Button>
      </div>
    </div>
  );
}
```

### MSW handlers for modules/lessons
```typescript
http.post('/api/courses/:courseId/modules', async ({ request }) => {
  const body = await request.json() as { title: string };
  return HttpResponse.json({ id: Date.now(), courseId: 1, title: body.title, order: 0, lessons: [] }, { status: 201 });
}),
http.delete('/api/modules/:id', () => new HttpResponse(null, { status: 204 })),
http.post('/api/modules/:moduleId/lessons', async ({ request }) => {
  const body = await request.json() as { title: string; lessonType: string };
  return HttpResponse.json({ id: Date.now(), ...body, order: 0, moduleId: 1 }, { status: 201 });
}),
http.delete('/api/lessons/:id', () => new HttpResponse(null, { status: 204 })),
```

---

## 🔵 Tuấn (FE Dev 2)

### `LessonTypeMenu` (dropdown to pick video/blog/test)
```tsx
export function LessonTypeMenu({ onSelect }: {
  onSelect: (type: LessonDto['lessonType']) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm"><Plus size={14} className="mr-1"/> Thêm bài</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onSelect('video')}>
          <Video size={14} className="mr-2"/> Video
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect('blog')}>
          <FileText size={14} className="mr-2"/> Bài viết
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect('test')}>
          <ClipboardList size={14} className="mr-2"/> Bài kiểm tra
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Video/Blog lesson edit forms (stubs)
Create placeholder pages at:
- `src/pages/instructor/VideoLessonEditPage.tsx` — Input for YouTube/Vimeo URL + live iframe preview
- `src/pages/instructor/BlogLessonEditPage.tsx` — Textarea for Markdown + rendered preview side-by-side

These will be wired to real APIs on Day 7.

---

## ✅ End-of-Day Checklist

- [ ] `POST /api/courses/{id}/modules` creates module (non-owner gets 403)
- [ ] `DELETE /api/modules/{id}` cascades to lessons
- [ ] `PATCH /api/modules/{id}/order` reorders correctly in DB
- [ ] Course editor page shows accordion with add/delete module buttons
- [ ] Lesson type menu offers video/blog/test choices
- [ ] LessonRow shows edit/delete on hover
