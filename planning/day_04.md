# Day 4 — Course Listing & Creation

**Goal**: Anyone (including guests) can browse public courses. Instructors can create courses.
**Done when**: Course list page loads with real data (or MSW mock), pagination works, instructor sees "Tạo khóa học" button and can create a course.

---

## 🔴 Trung (BE Lead)

### Task 1 — CourseEntity
File: `com/goctrithuc/courses/CourseEntity.java`

```java
@Entity
@Table(name = "courses")
public class CourseEntity {
  @Id private Long id;
  @Column(nullable = false) private String title;
  private String description;
  @Column(name = "thumbnail_url") private String thumbnailUrl;
  @Column(name = "is_published", nullable = false) private boolean isPublished;
  @Column(name = "created_at") private Instant createdAt;
  @Column(name = "updated_at") private Instant updatedAt;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private CourseVisibility visibility;

  @Column(name = "author_id", nullable = false)
  private Long authorId;

  private String settings;

  // ManyToOne to UserEntity for author details in response
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "author_id", insertable = false, updatable = false)
  private UserEntity author;
}

public enum CourseVisibility { Public, Restricted, Private }
```

### Task 2 — CourseRepository
File: `com/goctrithuc/courses/CourseRepository.java`

```java
public interface CourseRepository extends JpaRepository<CourseEntity, Long> {

  // For public listing (guests and logged-in users)
  @EntityGraph(attributePaths = {"author"})
  Page<CourseEntity> findByVisibilityAndIsPublishedTrue(
      CourseVisibility visibility, Pageable pageable);

  // For instructors — their own courses regardless of visibility
  @EntityGraph(attributePaths = {"author"})
  Page<CourseEntity> findByAuthorId(Long authorId, Pageable pageable);

  // Search by title (case-insensitive)
  @EntityGraph(attributePaths = {"author"})
  Page<CourseEntity> findByTitleContainingIgnoreCaseAndVisibility(
      String title, CourseVisibility visibility, Pageable pageable);
}
```

### Task 3 — `GET /api/courses` (paginated, visibility-filtered)
File: `com/goctrithuc/courses/CourseController.java`

```java
@RestController
@RequestMapping("/api/courses")
public class CourseController {

  private final CourseService courseService;

  // Public endpoint — guests can access
  @GetMapping
  public ResponseEntity<Page<CourseResponse>> listCourses(
      @RequestParam(defaultValue = "Public") String visibility,
      @RequestParam(required = false) String search,
      Pageable pageable,
      Authentication auth) {
    Page<CourseEntity> page = courseService.listPublic(visibility, search, pageable, auth);
    return ResponseEntity.ok(page.map(CourseResponse::from));
  }

  @PostMapping
  @PreAuthorize("@permissionService.hasPermission(#auth.principal.id, T(com.goctrithuc.shared.Permission).CREATE_COURSE)")
  public ResponseEntity<CourseResponse> createCourse(
      @Valid @RequestBody CreateCourseRequest req,
      Authentication auth) {
    Long authorId = getCurrentUserId(auth);
    CourseEntity course = courseService.create(authorId, req);
    return ResponseEntity.status(201).body(CourseResponse.from(course));
  }

  @GetMapping("/{id}")
  public ResponseEntity<CourseResponse> getCourse(
      @PathVariable Long id,
      Authentication auth) {
    CourseEntity course = courseService.findByIdWithAccessCheck(id, auth);
    return ResponseEntity.ok(CourseResponse.from(course));
  }
}
```

`CreateCourseRequest.java`:
```java
public record CreateCourseRequest(
    @NotBlank @Size(max = 200) String title,
    @NotBlank String description,
    String thumbnailUrl,
    @NotNull CourseVisibility visibility,
    String settings) {}
```

`CourseResponse.java`:
```java
public record CourseResponse(
    Long id, String title, String description,
    String thumbnailUrl, boolean isPublished,
    CourseVisibility visibility, UserResponse author,
    Instant createdAt, Instant updatedAt) {

  public static CourseResponse from(CourseEntity e) {
    return new CourseResponse(
        e.getId(), e.getTitle(), e.getDescription(),
        e.getThumbnailUrl(), e.isPublished(),
        e.getVisibility(), UserResponse.from(e.getAuthor()),
        e.getCreatedAt(), e.getUpdatedAt());
  }
}
```

### Task 4 — `CourseService.listPublic`
```java
@Service
public class CourseService {

  public Page<CourseEntity> listPublic(
      String visibilityStr, String search, Pageable pageable, Authentication auth) {

    CourseVisibility vis;
    try { vis = CourseVisibility.valueOf(visibilityStr); }
    catch (IllegalArgumentException e) { vis = CourseVisibility.Public; }

    if (search != null && !search.isBlank()) {
      return courseRepo.findByTitleContainingIgnoreCaseAndVisibility(search, vis, pageable);
    }
    return courseRepo.findByVisibilityAndIsPublishedTrue(vis, pageable);
  }

  public CourseEntity findByIdWithAccessCheck(Long id, Authentication auth) {
    CourseEntity c = courseRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

    if (c.getVisibility() == CourseVisibility.Private) {
      Long userId = getCurrentUserId(auth);
      boolean isAuthorOrAdmin = c.getAuthorId().equals(userId)
          || permissionService.hasPermission(userId, Permission.EDIT_ANY_COURSE);
      if (!isAuthorOrAdmin) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
    return c;
  }

  @Transactional
  public CourseEntity create(Long authorId, CreateCourseRequest req) {
    CourseEntity c = new CourseEntity();
    c.setId(idGenerator.nextId());
    c.setTitle(req.title());
    c.setDescription(req.description());
    c.setThumbnailUrl(req.thumbnailUrl());
    c.setVisibility(req.visibility());
    c.setSettings(req.settings());
    c.setAuthorId(authorId);
    c.setPublished(false);
    c.setCreatedAt(Instant.now());
    c.setUpdatedAt(Instant.now());
    return courseRepo.save(c);
  }
}
```

### Task 5 — Integration tests
- `GET /api/courses` without auth → 200 with public courses
- `GET /api/courses/{id}` for Private course without auth → 403
- `POST /api/courses` with student role → 403
- `POST /api/courses` with instructor role → 201

---

## 🔴 Anh (BE Dev / PM)

### Task 1 — `GET /api/courses/{id}` with author joined
Add `@EntityGraph(attributePaths = {"author"})` to `CourseRepository.findById` override:
```java
@EntityGraph(attributePaths = {"author"})
Optional<CourseEntity> findById(Long id);
```

### Task 2 — IdGenerator (Snowflake-like)
File: `com/goctrithuc/shared/IdGenerator.java`

For now, use a simple time-based ID (or a DB sequence). Simple version:
```java
@Component
public class IdGenerator {
  private static final AtomicLong counter = new AtomicLong(0);

  public long nextId() {
    // milliseconds since epoch shifted + counter for uniqueness
    return (Instant.now().toEpochMilli() << 12) | (counter.incrementAndGet() & 0xFFF);
  }
}
```

### Task 3 — PM: Publish API contract for Day 5 (Enrollment)

Post as GitHub Issue comment:
```
POST /api/courses/{id}/enroll
  Auth required. Body: none.
  Response: 201 EnrollmentDto | 409 (already enrolled)

GET /api/courses/{id}/access-status
  Auth required.
  Response: { status: "none" | "requested" | "enrolled" }

GET /api/courses/{id}/modules
  Auth: must be enrolled OR author OR admin
  Response: ModuleDto[] (with nested LessonDto[])
```

---

## 🔵 Vinh (FE Lead)

### Task 1 — Course Listing page
File: `src/pages/courses/CourseListPage.tsx`

```tsx
export function CourseListPage() {
  const [courses, setCourses] = useState<PageResponse<CourseDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [visibility, setVisibility] = useState<'Public' | 'Restricted'>('Public');

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PageResponse<CourseDto>>('/api/courses', {
        params: { search: search || undefined, page, size: 12, visibility },
      });
      setCourses(res.data);
    } finally {
      setLoading(false);
    }
  }, [search, page, visibility]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(fetchCourses, 300);
    return () => clearTimeout(t);
  }, [fetchCourses]);

  const canCreateCourse = usePermission(PERMISSION.CREATE_COURSE);

  return (
    <PageShell>
      <SectionHeader
        title="Khám phá khóa học"
        description="Tìm kiếm và đăng ký các khóa học phù hợp với bạn"
        action={canCreateCourse && (
          <Button id="btn-create-course" onClick={() => setShowCreate(true)}>
            <Plus size={16} className="mr-1" /> Tạo khóa học
          </Button>
        )}
      />

      {/* Search + Filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="input-course-search"
            placeholder="Tìm kiếm khóa học..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <Tabs value={visibility} onValueChange={(v) => setVisibility(v as 'Public' | 'Restricted')}>
          <TabsList>
            <TabsTrigger value="Public">Công khai</TabsTrigger>
            <TabsTrigger value="Restricted">Giới hạn</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : courses?.content.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Chưa có khóa học nào"
          description="Hãy thử tìm kiếm với từ khóa khác"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses?.content.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      )}

      {/* Pagination */}
      {courses && courses.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <Button variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>←</Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Trang {page + 1} / {courses.totalPages}
          </span>
          <Button variant="outline" disabled={page >= courses.totalPages - 1} onClick={() => setPage(p => p + 1)}>→</Button>
        </div>
      )}
    </PageShell>
  );
}
```

### Task 2 — `CourseCard` component
File: `src/pages/courses/_components/CourseCard.tsx`

```tsx
export function CourseCard({ course }: { course: CourseDto }) {
  const visibilityBadge = {
    Public: { label: 'Công khai', variant: 'secondary' as const },
    Restricted: { label: 'Giới hạn', variant: 'outline' as const },
    Private: { label: 'Riêng tư', variant: 'destructive' as const },
  }[course.visibility];

  return (
    <Link to={ROUTES.COURSE_DETAIL(course.id)} className="group block">
      <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
        {/* Thumbnail */}
        <div className="aspect-video overflow-hidden bg-muted">
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen size={32} className="text-muted-foreground" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <Badge {...visibilityBadge}>{visibilityBadge.label}</Badge>
            {!course.isPublished && <Badge variant="outline" className="text-amber-600">Bản nháp</Badge>}
          </div>
          <h3 className="font-semibold text-foreground line-clamp-2 mb-2">{course.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
          <div className="mt-3 flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={course.author.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">{course.author.displayName[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{course.author.displayName}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

---

## 🔵 Sâm (FE Dev 1)

### Task 1 — MSW handlers for courses
File: `src/mocks/handlers/courses.ts`

```typescript
import { http, HttpResponse } from 'msw';

const mockCourses = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1, title: `Khóa học mẫu ${i + 1}`,
  description: 'Mô tả khóa học này rất thú vị và bổ ích.',
  thumbnailUrl: null, isPublished: i % 3 !== 0, visibility: 'Public',
  author: { id: 1, displayName: 'Nguyễn Công Vinh', username: 'vinh_nc', avatarUrl: null },
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
}));

export const courseHandlers = [
  http.get('/api/courses', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 0);
    const size = Number(url.searchParams.get('size') ?? 12);
    const search = url.searchParams.get('search') ?? '';
    const filtered = mockCourses.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase())
    );
    const slice = filtered.slice(page * size, (page + 1) * size);
    return HttpResponse.json({
      content: slice, totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size), number: page, size,
    });
  }),
  http.get('/api/courses/:courseId', ({ params }) =>
    HttpResponse.json(mockCourses.find(c => c.id === Number(params.courseId)) ?? null)
  ),
  http.post('/api/courses', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...mockCourses[0], ...body, id: 999 }, { status: 201 });
  }),
];
```

---

## 🔵 Tuấn (FE Dev 2)

### Task 1 — `CreateCourseModal`
File: `src/pages/courses/_components/CreateCourseModal.tsx`

```tsx
export function CreateCourseModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: (course: CourseDto) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'Public' | 'Restricted' | 'Private'>('Public');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async () => {
    setLoading(true);
    setErrors({});
    try {
      const res = await api.post<CourseDto>('/api/courses', { title, description, visibility });
      onCreated(res.data);
      onClose();
      toast.success('Tạo khóa học thành công!');
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error('Tạo thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo khóa học mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="course-title">Tên khóa học *</Label>
            <Input id="course-title" value={title} onChange={e => setTitle(e.target.value)} />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
          </div>
          <div>
            <Label htmlFor="course-desc">Mô tả *</Label>
            <Textarea id="course-desc" rows={3} value={description}
              onChange={e => setDescription(e.target.value)} />
            {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description}</p>}
          </div>
          <div>
            <Label htmlFor="course-visibility">Chế độ hiển thị</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as 'Public' | 'Restricted' | 'Private')}>
              <SelectTrigger id="course-visibility"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Public">Công khai — ai cũng có thể đăng ký</SelectItem>
                <SelectItem value="Restricted">Giới hạn — cần được duyệt</SelectItem>
                <SelectItem value="Private">Riêng tư — chỉ bạn thấy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button id="btn-submit-create-course" onClick={submit} disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            Tạo khóa học
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## ✅ End-of-Day Checklist

- [ ] `GET /api/courses` returns paginated list (test with `curl` or browser)
- [ ] `GET /api/courses?search=java` filters results
- [ ] Private course returns 403 to unauthorized user
- [ ] `POST /api/courses` with student session returns 403
- [ ] Course listing page renders 12-card grid with skeletons then real data
- [ ] Search debounce works (no request fired on every keystroke)
- [ ] `CreateCourseModal` shows field errors inline (not just a toast)
- [ ] Dark mode looks correct on course cards
