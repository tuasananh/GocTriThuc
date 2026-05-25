# Day 3 — User Profile & Local Server File Uploads

**Goal**: Users can view and edit their profile. Avatar images upload directly to the backend and serve from local disk (mapped to a persistent volume).
**Done when**: Profile edits save to DB; avatar upload works end-to-end (local disk → DB → displayed in Navbar).

---

## 🔴 Trung (BE Lead)

### Task 1 — User profile endpoints
File: `com/goctrithuc/users/UserController.java` (Ensure update profile PATCH endpoints match this standard).

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

  private final UserService userService;

  @GetMapping("/{id}")
  public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
    return userService.findById(id)
        .map(UserResponse::from)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @PatchMapping("/{id}")
  public ResponseEntity<UserResponse> updateUser(
      @PathVariable Long id,
      @Valid @RequestBody UpdateUserRequest req,
      Authentication auth) {
    // Only the user themselves can update their own profile
    Long currentUserId = getCurrentUserId(auth);
    if (!currentUserId.equals(id)) {
      return ResponseEntity.status(403).build();
    }
    UserEntity updated = userService.updateProfile(id, req);
    return ResponseEntity.ok(UserResponse.from(updated));
  }
}
```

`UpdateUserRequest.java`:
```java
public record UpdateUserRequest(
    @Size(min = 2, max = 100) String displayName,
    @Size(min = 3, max = 30)
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username may only contain letters, numbers, underscores")
    String username,
    String avatarUrl) {}
```

`UserService.updateProfile`:
```java
@Transactional
public UserEntity updateProfile(Long id, UpdateUserRequest req) {
  UserEntity user = userRepo.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

  if (req.username() != null && !req.username().equals(user.getUsername())) {
    if (userRepo.existsByUsername(req.username())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
    }
    user.setUsername(req.username());
  }
  if (req.displayName() != null) user.setDisplayName(req.displayName());
  if (req.avatarUrl() != null) user.setAvatarUrl(req.avatarUrl());
  user.setUpdatedAt(Instant.now());
  return userRepo.save(user);
}
```

### Task 2 — File Storage & Upload API
File: `com/goctrithuc/files/FileController.java`
Integrate standard multipart form data uploads saving straight to local persistent drive.

```java
@RestController
@RequestMapping("/api/files")
public class FileController {

  private final FileService fileService;

  @PostMapping("/upload")
  public ResponseEntity<FileResponse> uploadFile(
      @RequestParam("file") MultipartFile file,
      Authentication auth) {
    Long userId = getCurrentUserId(auth);
    FileEntity entity = fileService.saveToLocalDisk(userId, file);
    return ResponseEntity.status(201).body(FileResponse.from(entity));
  }
}
```

Configure dynamic directories in `application.yaml`:
```yaml
app:
  upload-dir: ${UPLOAD_DIR:./uploads}
```

---

## 🔴 Anh (BE Dev / PM)

### Task 1 — FileEntity & Serve Controller
Expose file serving utilities reading disk files and streaming them straight to client image elements.
File: `com/goctrithuc/files/FileEntity.java`

```java
@Entity
@Table(name = "files")
public class FileEntity {
  @Id private Long id;
  @Column(name = "author_id") private Long authorId;
  private String provider; // 'local'
  @Column(name = "provider_value") private String providerValue; // relative path
  @Column(name = "created_at") private Instant createdAt;
}
```

File serving endpoint:
```java
@GetMapping("/serve/{id}")
public ResponseEntity<Resource> serveFile(@PathVariable Long id) {
  FileEntity file = fileService.findById(id);
  Path filePath = Paths.get(uploadDir).resolve(file.getProviderValue());
  Resource resource = new UrlResource(filePath.toUri());
  return ResponseEntity.ok()
      .header(HttpHeaders.CONTENT_TYPE, Files.probeContentType(filePath))
      .body(resource);
}
```

### Task 2 — Jakarta validation audits
Ensure email validations `@Email` and name constraints are fully configured.

---

## 🔵 Vinh (FE Lead)

### Task 1 — Profile view layouts
Expose profile updates and forms connecting to dynamic edit PATCH services.

### Task 2 — Direct Server multipart uploads
File: `src/pages/profile/_components/AvatarUpload.tsx`
Trigger multipart POST uploads to the backend.

```tsx
const handleFile = async (file: File) => {
  setUploading(true);
  try {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post<{ id: number; providerValue: string }>('/api/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    // Register file ID in user avatar profile
    const serveUrl = `/api/files/serve/${data.id}`;
    await api.patch(`/api/users/${userId}`, { avatarUrl: serveUrl });
    onUploaded(serveUrl);
  } finally {
    setUploading(false);
  }
};
```

---

## 🔵 Sâm (FE Dev 1)

### Task 1 — MSW handlers configuration
Add mock file handlers returning test upload responses.

```typescript
http.post('/api/files/upload', () =>
  HttpResponse.json({ id: 99, providerValue: 'uploads/mock.jpg' }, { status: 201 })
)
```

---

## 🔵 Tuấn (FE Dev 2)

### Task 1 — badge and helper directives
Build standard `<RoleBadge>` and `usePermission` directives.

---

## ✅ End-of-Day Checklist
- [ ] Profile edits PATCH successfully.
- [ ] Avatar multipart uploading saves file locally inside `./uploads`.
- [ ] Serves file back to browser seamlessly via `/api/files/serve/{id}`.
