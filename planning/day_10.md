# Day 10 — Announcements, Comments, Dashboards & Final Polish

**Goal**: Instructors post announcements. Students comment on lessons and announcements. Both dashboards are functional. Full integration QA passes.
**Done when**: All user flows work end-to-end. Both dashboards show real data. CI is green.

---

## 🔴 Trung (BE Lead)

### Announcement CRUD
`AnnouncementEntity.java`:
```java
@Entity @Table(name = "announcements")
public class AnnouncementEntity {
  @Id private Long id;
  @Column(name = "course_id") private Long courseId;
  @Column(nullable = false) private String title;
  @Column(nullable = false) private String content;
  private Instant createdAt; private Instant updatedAt;
}
```

`GET /api/courses/{id}/announcements` — paginated, any enrolled user or author
`POST /api/courses/{id}/announcements` — instructor/admin only
`PUT /api/announcements/{id}` — author only
`DELETE /api/announcements/{id}` — author or admin

### Announcement comments
`AnnouncementCommentEntity.java`:
```java
@Entity @Table(name = "announcement_comments")
public class AnnouncementCommentEntity {
  @Id private Long id;
  @Column(name = "user_id") private Long userId;
  @Column(nullable = false) private String content;
  @Column(name = "announcement_id") private Long announcementId;
  @Column(name = "parent_id") private Long parentId; // null = top-level
  private Instant createdAt; private Instant updatedAt;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", insertable = false, updatable = false)
  private UserEntity author;
}
```

`GET /api/announcements/{id}/comments` — threaded (top-level + replies):
```java
@GetMapping("/{announcementId}/comments")
public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long announcementId) {
  List<AnnouncementCommentEntity> all = commentRepo
      .findByAnnouncementIdOrderByCreatedAt(announcementId);
  // Group replies under parents client-side friendly: return flat list with parentId
  return ResponseEntity.ok(all.stream().map(CommentResponse::from).toList());
}
```

`POST /api/announcements/{id}/comments` — enrolled user or course author
`DELETE /api/announcement-comments/{id}` — own comment or admin (bitmask check)

### Lesson comments (same pattern)
`GET /api/lessons/{id}/comments`
`POST /api/lessons/{id}/comments`
`DELETE /api/lesson-comments/{id}`

### Access request management
`GET /api/courses/{id}/access-requests` — course author or admin
`POST /api/access-requests/{id}/approve` — course author or admin:
```java
@PostMapping("/{id}/approve")
public ResponseEntity<Void> approve(@PathVariable Long id, Authentication auth) {
  CourseAccessRequestEntity req = accessRequestRepo.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  Long userId = getCurrentUserId(auth);
  CourseEntity course = courseRepo.findById(req.getCourseId()).orElseThrow();
  if (!course.getAuthorId().equals(userId) &&
      !permissionService.hasPermission(userId, Permission.EDIT_ANY_COURSE))
    return ResponseEntity.status(403).build();

  // Create enrollment
  EnrollmentEntity e = new EnrollmentEntity();
  e.setId(new EnrollmentId(req.getUserId(), req.getCourseId()));
  e.setCreatedAt(Instant.now()); e.setUpdatedAt(Instant.now());
  enrollmentRepo.save(e);
  // Delete the request
  accessRequestRepo.delete(req);
  return ResponseEntity.noContent().build();
}
```

`DELETE /api/access-requests/{id}` — withdraw (by student) or decline (by author/admin)

---

## 🔴 Anh (BE Dev / PM)

### Final backend tasks
1. **N+1 audit**: Run all list endpoints with `show-sql=true`. Fix any that fire extra queries using `@EntityGraph` or `JOIN FETCH`.
2. **Final integration test pass**: Run `./mvnw test`. All tests must pass green.
3. **Spotless check**: Run `./mvnw spotless:check`. Zero violations.
4. **`GET /api/instructor/dashboard`** summary endpoint:
```java
// Returns: courses authored, total enrolled students, pending access requests
public record InstructorDashboardResponse(
    long totalCourses, long totalStudents, long pendingRequests) {}
```

5. **`GET /api/student/dashboard`** summary:
```java
// Returns enrolled courses with progress per course
public record StudentDashboardCourse(
    CourseResponse course, long completedLessons, long totalLessons, int percent) {}
```

6. **PM: Final integration QA** — test these flows manually:
   - Guest browses courses → sees only Public courses
   - Guest clicks enroll → redirected to login → after login → redirected back → enrolls
   - Student watches video → reads blog → marks complete → progress updates
   - Student takes test → submits → sees result
   - Instructor creates course → adds module → adds lessons → posts announcement
   - Admin approves access request → student can now access restricted course

---

## 🔵 Vinh (FE Lead)

### `CommentThread` — reusable for both lesson and announcement
File: `src/components/CommentThread.tsx`

```tsx
interface CommentThreadProps {
  comments: CommentDto[];
  onPost: (content: string, parentId?: number) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
  currentUserId: number | undefined;
}

export function CommentThread({ comments, onPost, onDelete, currentUserId }: CommentThreadProps) {
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const topLevel = comments.filter(c => !c.parentId);
  const replies = (parentId: number) => comments.filter(c => c.parentId === parentId);

  const post = async (content: string, parentId?: number) => {
    if (!content.trim()) return;
    setPosting(true);
    await onPost(content, parentId);
    setNewComment('');
    setPosting(false);
  };

  return (
    <div className="space-y-6 mt-6 border-t border-border pt-6">
      <h4 className="font-semibold">Bình luận ({comments.length})</h4>
      {/* New comment form */}
      {currentUserId && (
        <div className="flex gap-3">
          <Textarea className="flex-1 min-h-[80px]" placeholder="Viết bình luận..."
            value={newComment} onChange={e => setNewComment(e.target.value)} />
          <Button className="self-end" onClick={() => post(newComment)} disabled={posting || !newComment.trim()}>
            {posting ? <Loader2 size={16} className="animate-spin"/> : 'Gửi'}
          </Button>
        </div>
      )}
      {/* Comment list */}
      {topLevel.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
      )}
      {topLevel.map(c => (
        <CommentItem key={c.id} comment={c} replies={replies(c.id)}
          currentUserId={currentUserId} onReply={post} onDelete={onDelete} />
      ))}
    </div>
  );
}

function CommentItem({ comment, replies, currentUserId, onReply, onDelete }: {
  comment: CommentDto; replies: CommentDto[];
  currentUserId: number | undefined;
  onReply: (content: string, parentId: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const isOwn = currentUserId === comment.userId;

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0 mt-1">
        <AvatarImage src={comment.author.avatarUrl ?? undefined} />
        <AvatarFallback className="text-xs">{comment.author.displayName[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{comment.author.displayName}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
          </span>
          {isOwn && (
            <button onClick={() => onDelete(comment.id)}
              className="text-xs text-destructive hover:underline ml-auto">Xóa</button>
          )}
        </div>
        <p className="text-sm text-foreground">{comment.content}</p>
        {currentUserId && (
          <button className="text-xs text-muted-foreground hover:text-foreground mt-1"
            onClick={() => setShowReply(v => !v)}>Trả lời</button>
        )}
        {showReply && (
          <div className="flex gap-2 mt-2">
            <Input value={replyText} onChange={e => setReplyText(e.target.value)}
              placeholder="Trả lời..." className="h-8 text-sm" />
            <Button size="sm" className="h-8"
              onClick={() => { onReply(replyText, comment.id); setReplyText(''); setShowReply(false); }}>
              Gửi
            </Button>
          </div>
        )}
        {/* Nested replies */}
        {replies.map(r => (
          <div key={r.id} className="mt-3 ml-4 flex gap-2 border-l-2 border-border pl-3">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={r.author.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">{r.author.displayName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <span className="text-xs font-medium">{r.author.displayName}</span>
              <p className="text-xs text-foreground">{r.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Dark mode audit
Go through every page and verify:
- All text uses `text-foreground` or `text-muted-foreground` (not hardcoded colors)
- All backgrounds use `bg-background`, `bg-card`, or `bg-muted`
- All borders use `border-border`
- Hover states visible in both modes

---

## 🔵 Sâm (FE Dev 1)

### Announcement Feed page
File: `src/pages/courses/AnnouncementsPage.tsx`

```tsx
export function AnnouncementsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementDto[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, CommentDto[]>>({});

  useEffect(() => {
    api.get<PageResponse<AnnouncementDto>>(`/api/courses/${courseId}/announcements`)
      .then(r => setAnnouncements(r.data.content));
  }, [courseId]);

  const loadComments = async (annId: number) => {
    if (comments[annId]) return;
    const res = await api.get<CommentDto[]>(`/api/announcements/${annId}/comments`);
    setComments(prev => ({ ...prev, [annId]: res.data }));
  };

  const toggle = (id: number) => {
    setExpanded(prev => prev === id ? null : id);
    loadComments(id);
  };

  return (
    <PageShell>
      <SectionHeader title="Thông báo" />
      {announcements.length === 0
        ? <EmptyState title="Chưa có thông báo" icon={Bell} />
        : announcements.map(a => (
          <Card key={a.id} className="mb-4">
            <button className="w-full text-left p-4" onClick={() => toggle(a.id)}>
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">{a.title}</h3>
                <span className="text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </button>
            {expanded === a.id && (
              <CardContent>
                <p className="text-muted-foreground mb-4">{a.content}</p>
                <CommentThread
                  comments={comments[a.id] ?? []}
                  currentUserId={user?.id}
                  onPost={async (content, parentId) => {
                    await api.post(`/api/announcements/${a.id}/comments`, { content, parentId });
                    loadComments(a.id);
                  }}
                  onDelete={async (commentId) => {
                    await api.delete(`/api/announcement-comments/${commentId}`);
                    setComments(prev => ({
                      ...prev,
                      [a.id]: prev[a.id].filter(c => c.id !== commentId),
                    }));
                  }}
                />
              </CardContent>
            )}
          </Card>
        ))}
    </PageShell>
  );
}
```

Also add `<CommentThread>` to the bottom of `LessonPage.tsx`:
```tsx
// At the bottom of the lesson main content area:
<LessonResourceList lessonId={Number(lessonId)} />
<CommentThread
  comments={lessonComments}
  currentUserId={user?.id}
  onPost={async (content, parentId) => {
    await api.post(`/api/lessons/${lessonId}/comments`, { content, parentId });
    // reload comments
  }}
  onDelete={async (commentId) => {
    await api.delete(`/api/lesson-comments/${commentId}`);
  }}
/>
```

---

## 🔵 Tuấn (FE Dev 2)

### Student Dashboard
File: `src/pages/dashboard/StudentDashboardPage.tsx`

```tsx
export function StudentDashboardPage() {
  const [courses, setCourses] = useState<StudentDashboardCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<StudentDashboardCourse[]>('/api/student/dashboard')
      .then(r => setCourses(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <SectionHeader title="Học tập của tôi" />
      {loading ? <SkeletonList count={3} /> : courses.length === 0 ? (
        <EmptyState title="Bạn chưa đăng ký khóa học nào"
          description="Khám phá các khóa học để bắt đầu"
          action={<Button asChild><Link to={ROUTES.COURSES}>Khám phá</Link></Button>} />
      ) : (
        <div className="space-y-4">
          {courses.map(({ course, completedLessons, totalLessons, percent }) => {
            const nextLesson = undefined; // can be computed from modules
            return (
              <Card key={course.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                    {course.thumbnailUrl
                      ? <img src={course.thumbnailUrl} className="h-full w-full object-cover"/>
                      : <div className="flex h-full items-center justify-center"><BookOpen size={20} className="text-muted-foreground"/></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{completedLessons}/{totalLessons} bài hoàn thành</p>
                    <ProgressBar value={percent} />
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to={ROUTES.COURSE_DETAIL(course.id)}>Tiếp tục →</Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
```

### Instructor Dashboard
File: `src/pages/instructor/InstructorDashboardPage.tsx`

```tsx
export function InstructorDashboardPage() {
  const [summary, setSummary] = useState<InstructorDashboardResponse | null>(null);
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [requests, setRequests] = useState<AccessRequestDto[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<InstructorDashboardResponse>('/api/instructor/dashboard'),
      api.get<PageResponse<CourseDto>>('/api/courses', { params: { mine: true } }),
    ]).then(([s, c]) => { setSummary(s.data); setCourses(c.data.content); });
  }, []);

  const approve = async (requestId: number, courseId: number) => {
    await api.post(`/api/access-requests/${requestId}/approve`);
    // Reload access requests for that course
    const res = await api.get<AccessRequestDto[]>(`/api/courses/${courseId}/access-requests`);
    setRequests(prev => [...prev.filter(r => r.courseId !== courseId), ...res.data]);
    toast.success('Đã duyệt yêu cầu');
  };

  const decline = async (requestId: number) => {
    await api.delete(`/api/access-requests/${requestId}`);
    setRequests(prev => prev.filter(r => r.id !== requestId));
    toast.success('Đã từ chối yêu cầu');
  };

  return (
    <PageShell>
      <SectionHeader title="Quản lý giảng dạy" />
      {/* Stats row */}
      {summary && (
        <div className="mb-8 grid grid-cols-3 gap-4">
          <StatCard label="Khóa học" value={summary.totalCourses} icon={BookOpen} />
          <StatCard label="Học viên" value={summary.totalStudents} icon={Users} />
          <StatCard label="Yêu cầu chờ duyệt" value={summary.pendingRequests} icon={Clock} />
        </div>
      )}
      {/* Course list */}
      <h3 className="font-semibold mb-3">Khóa học của tôi</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {courses.map(c => (
          <Card key={c.id} className="p-4">
            <h4 className="font-medium truncate">{c.title}</h4>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to={ROUTES.COURSE_EDIT(c.id)}>Chỉnh sửa</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {/* Access requests */}
      {requests.length > 0 && (
        <>
          <h3 className="font-semibold mb-3">Yêu cầu tham gia ({requests.length})</h3>
          <div className="space-y-2">
            {requests.map(r => (
              <Card key={r.id} className="flex items-center gap-4 p-4">
                <UserCard user={r.user} />
                <p className="flex-1 text-sm text-muted-foreground truncate">{r.courseTitle}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approve(r.id, r.courseId)}>Duyệt</Button>
                  <Button size="sm" variant="destructive" onClick={() => decline(r.id)}>Từ chối</Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
```

### Final: Prettier + ESLint clean pass
```bash
cd frontend
pnpm run format
pnpm run lint
```
Fix all warnings. Zero lint errors before merging to `main`.

---

## ✅ Final End-of-Day / Project Checklist

### Backend (Trung + Anh)
- [ ] All announcement + comment endpoints working and tested
- [ ] Access request approve/decline endpoints working
- [ ] Instructor and student dashboard summary endpoints working
- [ ] Zero N+1 queries in all list endpoints (verified with `show-sql`)
- [ ] All tests green (`./mvnw test`)
- [ ] Spotless check passes (`./mvnw spotless:check`)

### Frontend (Vinh + Sâm + Tuấn)
- [ ] `CommentThread` works on both lesson page and announcement page
- [ ] Announcement feed expands/collapses with comments
- [ ] Student Dashboard: enrolled courses with correct progress bars
- [ ] Instructor Dashboard: course list, pending requests with approve/decline buttons
- [ ] Prettier + ESLint clean (`pnpm run format && pnpm run lint`)
- [ ] All pages tested in light AND dark mode
- [ ] Responsive at 375px, 768px, 1280px

### Integration (Anh / PM)
- [ ] Docker prod image builds successfully
- [ ] All user flows work against the real backend (not just MSW)
- [ ] GitHub Actions CI passes on `main` (format + build + test + CodeQL)
