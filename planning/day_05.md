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

### Task 2 — Access requests
`CourseAccessRequestEntity.java` with `status` enum (`requested`, `accepted`):
```java
@Entity @Table(name = "course_access")  // or reuse existing if schema has it
```

`POST /api/courses/{id}/access-requests` — create request
`DELETE /api/access-requests/{id}` — withdraw or admin delete
`POST /api/access-requests/{id}/approve` — course author or admin only

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
```java
@GetMapping("/{id}/modules")
public ResponseEntity<List<ModuleResponse>> getModules(
    @PathVariable Long id, Authentication auth) {
  CourseEntity course = courseService.findByIdWithAccessCheck(id, auth);
  Long userId = auth != null ? getCurrentUserId(auth) : null;

  boolean canAccess = userId != null && (
      enrollmentRepo.existsById(new EnrollmentId(userId, id))
      || course.getAuthorId().equals(userId)
      || permissionService.hasPermission(userId, Permission.EDIT_ANY_COURSE));

  if (!canAccess) return ResponseEntity.status(403).build();

  List<ModuleEntity> modules = moduleRepo.findByCourseIdOrderByOrder(id);
  return ResponseEntity.ok(modules.stream().map(m -> ModuleResponse.from(m, userId)).toList());
}
```

---

## 🔴 Anh (BE Dev / PM)

### Task 1 — ModuleEntity & LessonEntity (read-only for Day 5)
```java
@Entity @Table(name = "modules")
public class ModuleEntity {
  @Id private Long id;
  @Column(name = "course_id") private Long courseId;
  private String title;
  @Column(name = "\"order\"") private int order;
  private Instant createdAt; private Instant updatedAt;

  @OneToMany(mappedBy = "moduleId", fetch = FetchType.LAZY)
  private List<LessonEntity> lessons;
}

@Entity @Table(name = "lessons")
public class LessonEntity {
  @Id private Long id;
  private String title;
  @Enumerated(EnumType.STRING) @Column(name = "lesson_type") private LessonType lessonType;
  @Column(name = "\"order\"") private int order;
  @Column(name = "module_id") private Long moduleId;
}

public enum LessonType { blog, video, test }
```

Add `LessonCompletionEntity` for tracking:
```java
@Entity @Table(name = "lesson_completions")
public class LessonCompletionEntity {
  @EmbeddedId private LessonCompletionId id;
  // id = (lessonId, userId)
}
```

### Task 2 — Integration tests for enrollment
- Student enrolls in public course → 201
- Student enrolls twice → 409
- Student tries to enroll in Private course → 403
- Guest calls access-status → 401

---

## 🔵 Vinh (FE Lead)

### Task 1 — Course Detail page header
File: `src/pages/courses/CourseDetailPage.tsx`

```tsx
export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseDto | null>(null);
  const [status, setStatus] = useState<AccessStatus>('none');
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<CourseDto>(`/api/courses/${courseId}`),
      user ? api.get<{ status: AccessStatus }>(`/api/courses/${courseId}/access-status`) : null,
    ]).then(([courseRes, statusRes]) => {
      setCourse(courseRes.data);
      if (statusRes) setStatus(statusRes.data.status);
    }).finally(() => setLoading(false));
  }, [courseId, user]);

  useEffect(() => {
    if (status === 'enrolled') {
      api.get<ModuleDto[]>(`/api/courses/${courseId}/modules`)
        .then(r => setModules(r.data));
    }
  }, [status, courseId]);

  const enroll = async () => {
    setEnrolling(true);
    try {
      if (course?.visibility === 'Restricted') {
        await api.post(`/api/courses/${courseId}/access-requests`);
        setStatus('requested');
        toast.success('Yêu cầu đã được gửi. Vui lòng chờ duyệt.');
      } else {
        await api.post(`/api/courses/${courseId}/enroll`);
        setStatus('enrolled');
        toast.success('Đăng ký thành công!');
      }
    } finally { setEnrolling(false); }
  };

  if (loading) return <PageShell><Skeleton className="h-64 w-full" /></PageShell>;
  if (!course) return <PageShell><p>Không tìm thấy khóa học.</p></PageShell>;

  const enrollButton = {
    none: <Button id="btn-enroll" onClick={enroll} disabled={enrolling}>
      {enrolling ? <Loader2 className="animate-spin mr-2" size={16}/> : null}
      {course.visibility === 'Restricted' ? 'Yêu cầu tham gia' : 'Đăng ký học'}
    </Button>,
    requested: <Button variant="outline" disabled>Đang chờ duyệt...</Button>,
    enrolled:  <Button variant="secondary" disabled>✓ Đã đăng ký</Button>,
  }[user ? status : 'none'];

  return (
    <div>
      {/* Banner */}
      <div className="relative h-64 bg-gradient-to-br from-primary/20 to-muted overflow-hidden">
        {course.thumbnailUrl && (
          <img src={course.thumbnailUrl} className="absolute inset-0 h-full w-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 flex flex-col justify-end p-8">
          <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
          <p className="mt-1 text-muted-foreground">{course.author.displayName}</p>
        </div>
      </div>
      {/* Body */}
      <PageShell>
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main */}
          <div className="flex-1">
            <p className="text-muted-foreground">{course.description}</p>
            {status !== 'enrolled' && !user && (
              <Link to={`/login?redirect=/courses/${courseId}`}>
                <Button className="mt-4">Đăng nhập để đăng ký</Button>
              </Link>
            )}
            {user && <div className="mt-4">{enrollButton}</div>}
          </div>
          {/* Sidebar */}
          {status === 'enrolled' && (
            <aside className="w-full lg:w-72">
              <ModuleSidebar modules={modules} courseId={Number(courseId)} />
            </aside>
          )}
        </div>
      </PageShell>
    </div>
  );
}
```

---

## 🔵 Sâm (FE Dev 1)

### Task 1 — `ModuleSidebar` component
File: `src/pages/courses/_components/ModuleSidebar.tsx`

```tsx
export function ModuleSidebar({ modules, courseId }: { modules: ModuleDto[]; courseId: number }) {
  const lessonTypeIcon = { video: Video, blog: FileText, test: ClipboardList };

  return (
    <div className="space-y-2">
      {modules.length === 0 && <EmptyState title="Chưa có bài học nào" icon={BookOpen} />}
      {modules.map((mod) => (
        <Collapsible key={mod.id} defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-muted px-3 py-2 font-medium text-sm hover:bg-muted/80">
            {mod.title}
            <ChevronDown size={16} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-0.5 pl-2">
            {mod.lessons.map((lesson) => {
              const Icon = lessonTypeIcon[lesson.lessonType];
              return (
                <Link
                  key={lesson.id}
                  to={ROUTES.LESSON(courseId, lesson.id)}
                  className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                >
                  {lesson.isCompleted
                    ? <CheckCircle size={14} className="text-green-500" />
                    : <Icon size={14} className="text-muted-foreground" />}
                  <span className={lesson.isCompleted ? 'line-through text-muted-foreground' : ''}>
                    {lesson.title}
                  </span>
                </Link>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
```

### Task 2 — MSW handlers for enrollment & access-status
```typescript
http.post('/api/courses/:id/enroll', () => new HttpResponse(null, { status: 201 })),
http.get('/api/courses/:id/access-status', () => HttpResponse.json({ status: 'none' })),
http.get('/api/courses/:id/modules', () => HttpResponse.json([
  { id: 1, courseId: 1, title: 'Module 1', order: 1,
    lessons: [
      { id: 1, title: 'Bài mở đầu', lessonType: 'video', order: 1, moduleId: 1, isCompleted: false },
      { id: 2, title: 'Khái niệm cơ bản', lessonType: 'blog', order: 2, moduleId: 1, isCompleted: true },
    ]},
])),
```

---

## 🔵 Tuấn (FE Dev 2)

### Task 1 — `RestrictedAccessBanner`
```tsx
export function RestrictedAccessBanner({ onRequest, status }: {
  onRequest: () => void; status: AccessStatus;
}) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-4 flex items-center gap-4">
      <Lock size={20} className="text-amber-600 shrink-0" />
      <div className="flex-1">
        <p className="font-medium text-amber-800 dark:text-amber-200">Khóa học giới hạn</p>
        <p className="text-sm text-amber-700 dark:text-amber-300">Bạn cần được duyệt để tham gia khóa học này.</p>
      </div>
      {status === 'none' && <Button size="sm" onClick={onRequest}>Gửi yêu cầu</Button>}
      {status === 'requested' && <Badge variant="outline">Đang chờ</Badge>}
    </div>
  );
}
```

### Task 2 — `CourseEditModal` (stub for instructors)
A basic modal that loads the course data and allows editing title/description/visibility/thumbnail. Calls `PUT /api/courses/{id}`. Reuse the form structure from `CreateCourseModal` with pre-filled values.

---

## ✅ End-of-Day Checklist

- [ ] Student enrolls in Public course → status changes to "enrolled" → modules appear
- [ ] Student requests Restricted course → status changes to "requested" → button disabled
- [ ] Guest sees "Đăng nhập để đăng ký" button → redirected to login
- [ ] Private course returns 403 for non-author/admin
- [ ] Module sidebar shows lessons with icons and completion checkmarks
