# Day 10 — Reddit Comments, Instructor Dashboards, Admin Control & Review

**Goal**: Instructors post announcements. Infinite Reddit-style comments are functional. Student, Instructor, and Admin dashboards are complete. Full integration QA passes.
**Done when**: All user flows work end-to-end against real server database records.

---

## 🔴 Trung (BE Lead)

### Infinite Threaded Comments (Reddit Style Resolution)
`lesson_comments` and `announcement_comments` both support infinite nesting mapping `parent_id` foreign keys with `ON DELETE CASCADE`.

Top-level comments are paginated (20 per page). Fetch replies up to a depth of **5 levels**. Sub-trees deeper than 5 levels are loaded in isolated views when requested.

```java
@GetMapping("/{lessonId}/comments")
public ResponseEntity<List<CommentResponse>> getLessonComments(
    @PathVariable Long lessonId,
    @RequestParam(defaultValue = "0") int page) {
  // Page root comments
  Page<LessonCommentEntity> roots = commentRepo
      .findByLessonIdAndParentIdIsNullOrderByCreatedAtDesc(lessonId, PageRequest.of(page, 20));
      
  // Fetch matching replies up to depth 5 recursively
  List<CommentResponse> tree = commentService.buildSubtree(roots.getContent(), 5);
  return ResponseEntity.ok(tree);
}
```

---

## 🔴 Anh (BE Dev / PM)

### Task 1 — Admin User Management endpoints
Expose role management controllers restricted strictly to Admin roles.
File: `com/goctrithuc/admin/AdminUserController.java`

```java
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("@permissionService.hasPermission(principal.id, 1)")
public class AdminUserController {

  @GetMapping
  public ResponseEntity<PageResponse<UserDto>> listUsers(Pageable pageable) {
    return ResponseEntity.ok(userService.findAllUsers(pageable));
  }

  @PutMapping("/{id}/role")
  public ResponseEntity<Void> updateUserRole(
      @PathVariable Long id,
      @RequestBody Map<String, String> body) {
    userService.updateUserRole(id, body.get("role"));
    return ResponseEntity.noContent().build();
  }
}
```

### Task 2 — SQL Profiling and formatting audits
Ensure all N+1 loops are audited and spotless clean.

---

## 🔵 Vinh (FE Lead)

### Reusable Reddit-Style Comments Drawer
File: `src/components/CommentThread.tsx`
Renders infinitely nested discussion sheets recursively. If comments go deeper than **5 levels**, render a "View single thread" link to fetch that sub-branch in an isolated view.

```tsx
function CommentItem({ comment, depth, currentUserId, onReply, onDelete }: {
  comment: CommentDto; depth: number;
  currentUserId: string | undefined;
  onReply: (content: string, parentId: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [showReply, setShowReply] = useState(false);
  
  // Depth check for Reddit-style redirection
  const isDeep = depth >= 5;

  return (
    <div className="pl-4 border-l border-border mt-3">
      <div className="flex gap-2 items-start">
        <Avatar className="h-8 w-8" />
        <div className="flex-1">
          <p className="text-sm font-medium">{comment.author.displayName}</p>
          <p className="text-sm mt-1">{comment.content}</p>
          
          {isDeep ? (
            <Link to={`/comments/thread/${comment.id}`} className="text-xs text-primary hover:underline block mt-2">
              Xem riêng nhánh thảo luận này →
            </Link>
          ) : (
            <>
              <button onClick={() => setShowReply(!showReply)} className="text-xs text-muted-foreground mr-3 mt-1">Trả lời</button>
              {comment.author.id === currentUserId && (
                <button onClick={() => onDelete(comment.id)} className="text-xs text-destructive">Xóa</button>
              )}
            </>
          )}
        </div>
      </div>
      
      {!isDeep && comment.replies?.map(reply => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} currentUserId={currentUserId} onReply={onReply} onDelete={onDelete} />
      ))}
    </div>
  );
}
```

---

## 🔵 Sâm (FE Dev 1)

### Announcements Boards
Announcements streams and comment drawers.

---

## 🔵 Tuấn (FE Dev 2)

### Dashboards & Admin Role Grids
File: `src/pages/admin/AdminDashboardPage.tsx`
Admin panel displaying a paginated table of users with a role dropdown picker connecting to role promotion APIs.

---

## ✅ End-of-Day Checklist
- [ ] Reddit comment recursive rendering handles levels deeper than 5 with redirection links.
- [ ] Deleting parent comment cascade-wipes nested child comments.
- [ ] Admin panel table can promote/demote user roles successfully.
