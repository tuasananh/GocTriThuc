# Day 6 — Modules & Lesson Editor

**Goal**: Instructors can create, edit, delete and reorder modules and lessons
within a course. **Done when**: Course editor page shows modules with lessons;
add/delete/reorder all work using clean Up/Down arrows.

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
      !permissionService.hasPermission(userId, Permission.ADMIN))
    return ResponseEntity.status(403).build();

  int nextOrder = moduleRepo.countByCourseId(courseId);
  ModuleEntity m = new ModuleEntity();
  // ID is assigned by DB via DEFAULT generate_snowflake_id() — do not set manually
  m.setCourseId(courseId);
  m.setTitle(req.title());
  m.setOrder(nextOrder);
  m.setCreatedAt(Instant.now()); m.setUpdatedAt(Instant.now());
  return ResponseEntity.status(201).body(ModuleResponse.from(moduleRepo.save(m)));
}

public record CreateModuleRequest(@NotBlank @Size(max = 200) String title) {}
```

`PUT /api/modules/{id}` — update title `DELETE /api/modules/{id}` — delete
(cascade to lessons) `PATCH /api/modules/{id}/order` — update order field:

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
- `lessonType == blog` → insert row in `lesson_blogs` with required `content`
  (even if it's the BlockNote empty-document HTML — `content NOT NULL`)
- `lessonType == test` → insert row in `lesson_tests` with required `statement`
  and `timeLimit` (`NOT NULL` columns — no empty row allowed)

`PUT /api/lessons/{id}` — update title only (content is updated separately by
Day 7) `DELETE /api/lessons/{id}` — delete lesson + sub-entity
`PATCH /api/lessons/{id}/order` — same pattern as module reorder

---

## 🔴 Anh (BE Dev / PM)

### Task 1 — `GET /api/lessons/{id}` (content included)

Expose lesson content details.

### Task 2 — Write reorder service helper

Implement simple Up/Down contiguous index shifts.

---

## 🔵 Vinh (FE Lead)

### Course Editor page

Layout modules.

---

## 🔵 Sâm (FE Dev 1)

### `LessonRow` with Up/Down Sorting Buttons (Simple UI Resolution)

File: `src/pages/instructor/_components/LessonRow.tsx`

```tsx
export function LessonRow({
  lesson,
  isFirst,
  isLast,
  onReorder,
  onReload,
}: {
  lesson: LessonDto;
  isFirst: boolean;
  isLast: boolean;
  onReorder: (direction: "up" | "down") => void;
  onReload: () => void;
}) {
  const icons = { video: Video, blog: FileText, test: ClipboardList };
  const Icon = icons[lesson.lessonType];

  const deleteLesson = async () => {
    if (!confirm(`Xóa "${lesson.title}"?`)) return;
    await api.delete(`/api/lessons/${lesson.id}`);
    onReload();
  };

  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted group">
      {/* Up/Down buttons instead of complex drag-drop */}
      <div className="flex flex-col gap-0.5 opacity-60 hover:opacity-100 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          disabled={isFirst}
          onClick={() => onReorder("up")}
        >
          <ChevronUp size={12} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          disabled={isLast}
          onClick={() => onReorder("down")}
        >
          <ChevronDown size={12} />
        </Button>
      </div>
      <Icon size={14} className="text-muted-foreground shrink-0" />
      <span className="flex-1 text-sm">{lesson.title}</span>
      <div className="hidden gap-1 group-hover:flex">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/instructor/lessons/${lesson.id}/edit`}>
            <Pencil size={12} />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" onClick={deleteLesson}>
          <Trash2 size={12} className="text-destructive" />
        </Button>
      </div>
    </div>
  );
}
```

---

## 🔵 Tuấn (FE Dev 2)

### `LessonTypeMenu` & Content Forms

Integrate `BlockNote` editor inside the Blog editing form instead of raw
textarea.

---

## ✅ End-of-Day Checklist

- [ ] Up/Down sorting arrows reorder modules and lessons successfully.
- [ ] BlockNote editor correctly loaded inside `<BlogLessonForm>` blog editor
      views.
