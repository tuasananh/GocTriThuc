# Day 3 — User Profile & Cloudinary File Upload

**Goal**: Users can view and edit their profile. Avatar images upload to Cloudinary. File metadata is stored in the `files` table.
**Done when**: Profile edits save to DB; avatar upload works end-to-end (Cloudinary → DB → displayed in Navbar).

---

## 🔴 Trung (BE Lead)

### Task 1 — User profile endpoints
File: `com/goctrithuc/users/UserController.java`

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

### Task 2 — Cloudinary signed upload URL endpoint
File: `com/goctrithuc/files/FileController.java`

```java
@RestController
@RequestMapping("/api/files")
public class FileController {

  private final CloudinaryService cloudinaryService;
  private final FileService fileService;

  @PostMapping("/upload-url")
  public ResponseEntity<UploadUrlResponse> getUploadUrl(Authentication auth) {
    Long userId = getCurrentUserId(auth);
    Map<String, Object> params = cloudinaryService.generateSignedUploadParams(userId);
    return ResponseEntity.ok(new UploadUrlResponse(
        (String) params.get("upload_url"),
        (String) params.get("signature"),
        (String) params.get("api_key"),
        (Long) params.get("timestamp"),
        (String) params.get("folder")));
  }

  @PostMapping
  public ResponseEntity<FileResponse> registerFile(
      @Valid @RequestBody RegisterFileRequest req,
      Authentication auth) {
    Long userId = getCurrentUserId(auth);
    FileEntity file = fileService.register(userId, req.providerValue());
    return ResponseEntity.status(201).body(FileResponse.from(file));
  }
}
```

`CloudinaryService.java` — signs upload params:
```java
@Service
public class CloudinaryService {
  @Value("${cloudinary.cloud-name}") private String cloudName;
  @Value("${cloudinary.api-key}")    private String apiKey;
  @Value("${cloudinary.api-secret}") private String apiSecret;

  public Map<String, Object> generateSignedUploadParams(Long userId) {
    long timestamp = Instant.now().getEpochSecond();
    String folder = "goctrithuc/users/" + userId;
    String toSign = "folder=" + folder + "&timestamp=" + timestamp + apiSecret;
    String signature = DigestUtils.sha1Hex(toSign);
    return Map.of(
        "upload_url", "https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload",
        "api_key", apiKey,
        "timestamp", timestamp,
        "signature", signature,
        "folder", folder);
  }
}
```

Add to `application.yml`:
```yaml
cloudinary:
  cloud-name: ${CLOUDINARY_CLOUD_NAME}
  api-key: ${CLOUDINARY_API_KEY}
  api-secret: ${CLOUDINARY_API_SECRET}
```

Add to `.env.example`:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Task 3 — Integration tests
- `GET /api/users/{id}` → 200 with user JSON
- `PATCH /api/users/{id}` with wrong user → 403
- `PATCH /api/users/{id}` with duplicate username → 409
- `PATCH /api/users/{id}` with valid data → 200 and DB updated

---

## 🔴 Anh (BE Dev / PM)

### Task 1 — FileEntity & FileService
File: `com/goctrithuc/files/FileEntity.java`

```java
@Entity
@Table(name = "files")
public class FileEntity {
  @Id private Long id;
  @Column(name = "author_id") private Long authorId;
  @Enumerated(EnumType.STRING) private FileProvider provider;
  @Column(name = "provider_value") private String providerValue;
  @Column(name = "created_at") private Instant createdAt;
  @Column(name = "uploaded_at") private Instant uploadedAt;
  // getters/setters
}

public enum FileProvider { cloudinary, supabase, aws_s3 }
```

`FileService.java`:
```java
@Service
@Transactional
public class FileService {
  private final FileRepository fileRepo;
  private final IdGenerator idGenerator;

  public FileEntity register(Long authorId, String providerValue) {
    FileEntity f = new FileEntity();
    f.setId(idGenerator.nextId());
    f.setAuthorId(authorId);
    f.setProvider(FileProvider.cloudinary);
    f.setProviderValue(providerValue);
    f.setCreatedAt(Instant.now());
    f.setUploadedAt(Instant.now());
    return fileRepo.save(f);
  }
}
```

### Task 2 — Jakarta validation on all Day 1–2 DTOs

Go back through `UpdateUserRequest` and all request records created in Day 2 and ensure:
- `@NotBlank` on all required string fields
- `@Size` limits where appropriate
- `@Email` on email fields

### Task 3 — PM: Publish API contract for Day 4 (Courses)

Post the following as a GitHub Issue comment under the Day 4 frontend issue:

```
GET /api/courses
  Query params: page (0-indexed), size (default 20), visibility (Public/Restricted/Private), search
  Response: PageResponse<CourseDto>
    CourseDto: { id, title, description, thumbnailUrl, isPublished, visibility, author: UserDto }

POST /api/courses
  Body: { title, description, thumbnailUrl?, visibility, settings? }
  Response: 201 CourseDto

GET /api/courses/{id}
  Response: 200 CourseDto | 403 (private, not author/admin) | 404
```

---

## 🔵 Vinh (FE Lead)

### Task 1 — User Profile page
File: `src/pages/profile/UserProfilePage.tsx`

```tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import api from '@/lib/api';
import type { UserDto } from '@/dtos';
import { PageShell } from '@/components/PageShell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvatarUpload } from './_components/AvatarUpload';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner'; // or your toast lib

export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: me, refetch } = useAuth();
  const isOwn = me?.id === Number(userId);

  const [profile, setProfile] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<UserDto>(`/api/users/${userId}`)
      .then((r) => { setProfile(r.data); setDisplayName(r.data.displayName); setUsername(r.data.username); })
      .finally(() => setLoading(false));
  }, [userId]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.patch<UserDto>(`/api/users/${userId}`, { displayName, username });
      setProfile(res.data);
      setEditing(false);
      await refetch(); // update Navbar avatar
      toast.success('Cập nhật thành công');
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <PageShell>
      <div className="space-y-4 max-w-lg">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </PageShell>
  );

  if (!profile) return <PageShell><p>Không tìm thấy người dùng.</p></PageShell>;

  return (
    <PageShell>
      <Card className="max-w-lg">
        <CardHeader>
          <AvatarUpload
            currentUrl={profile.avatarUrl}
            userId={profile.id}
            editable={isOwn}
            onUploaded={(url) => {
              api.patch(`/api/users/${profile.id}`, { avatarUrl: url });
              setProfile((p) => p ? { ...p, avatarUrl: url } : p);
            }}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-1">
                <Label htmlFor="displayName">Tên hiển thị</Label>
                <Input id="displayName" value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="username">Tên người dùng</Label>
                <Input id="username" value={username}
                  onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button onClick={save} disabled={saving}>Lưu</Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>Hủy</Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xl font-semibold">{profile.displayName}</p>
              <p className="text-muted-foreground">@{profile.username}</p>
              {isOwn && <Button variant="outline" onClick={() => setEditing(true)}>Chỉnh sửa</Button>}
            </>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
```

### Task 2 — Cloudinary upload flow in `AvatarUpload`
File: `src/pages/profile/_components/AvatarUpload.tsx`

```tsx
export function AvatarUpload({ currentUrl, userId, editable, onUploaded }: {
  currentUrl: string | null;
  userId: number;
  editable: boolean;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      // 1. Get signed upload params from backend
      const { data } = await api.post<{
        upload_url: string; signature: string; api_key: string;
        timestamp: number; folder: string;
      }>('/api/files/upload-url');

      // 2. Upload directly to Cloudinary
      const form = new FormData();
      form.append('file', file);
      form.append('api_key', data.api_key);
      form.append('timestamp', String(data.timestamp));
      form.append('signature', data.signature);
      form.append('folder', data.folder);
      const cloudRes = await fetch(data.upload_url, { method: 'POST', body: form });
      const cloudJson = await cloudRes.json();

      // 3. Register in our DB
      await api.post('/api/files', { providerValue: cloudJson.secure_url });

      onUploaded(cloudJson.secure_url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative h-24 w-24">
      <Avatar className="h-24 w-24">
        <AvatarImage src={currentUrl ?? undefined} />
        <AvatarFallback className="text-2xl">?</AvatarFallback>
      </Avatar>
      {editable && (
        <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-primary p-1.5 text-primary-foreground shadow-md hover:bg-primary/90">
          <Camera size={14} />
          <input type="file" accept="image/*" className="sr-only"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
      )}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
          <Loader2 size={20} className="animate-spin text-white" />
        </div>
      )}
    </div>
  );
}
```

---

## 🔵 Sâm (FE Dev 1)

### Task 1 — MSW handlers for user profile & files
File: `src/mocks/handlers/users.ts`

```typescript
import { http, HttpResponse } from 'msw';

const mockUser = {
  id: 1, email: 'vinh@example.com',
  displayName: 'Nguyễn Công Vinh', username: 'vinh_nc', avatarUrl: null,
};

export const userHandlers = [
  http.get('/api/users/:userId', ({ params }) =>
    HttpResponse.json({ ...mockUser, id: Number(params.userId) })
  ),
  http.patch('/api/users/:userId', async ({ request, params }) => {
    const body = await request.json() as Record<string, string>;
    return HttpResponse.json({ ...mockUser, id: Number(params.userId), ...body });
  }),
  http.post('/api/files/upload-url', () =>
    HttpResponse.json({
      upload_url: 'https://api.cloudinary.com/v1_1/demo/image/upload',
      api_key: 'demo', timestamp: Date.now(), signature: 'mock', folder: 'goctrithuc/users/1',
    })
  ),
  http.post('/api/files', () =>
    HttpResponse.json({ id: 99, providerValue: 'https://res.cloudinary.com/demo/test.jpg' }, { status: 201 })
  ),
];
```

Add `userHandlers` to `src/mocks/handlers/index.ts`.

---

## 🔵 Tuấn (FE Dev 2)

### Task 1 — `RoleBadge` component
File: `src/components/RoleBadge.tsx`

```tsx
import { Badge } from '@/components/ui/badge';

const roleConfig = {
  admin:      { label: 'Quản trị', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  instructor: { label: 'Giảng viên', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  student:    { label: 'Học viên', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
} as const;

export function RoleBadge({ role }: { role: keyof typeof roleConfig }) {
  const cfg = roleConfig[role] ?? { label: role, className: '' };
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}
```

### Task 2 — `usePermission` hook
File: `src/hooks/usePermission.ts`

```typescript
import { useAuth } from '@/providers/AuthProvider';

// Bitmask constants mirrored from backend Permission.java
export const PERMISSION = {
  CREATE_COURSE:      1n << 0n,
  EDIT_OWN_COURSE:    1n << 1n,
  PUBLISH_COURSE:     1n << 2n,
  DELETE_OWN_COURSE:  1n << 3n,
  EDIT_ANY_COURSE:    1n << 4n,
  DELETE_ANY_COURSE:  1n << 5n,
  ENROLL_COURSE:      1n << 6n,
  APPROVE_ENROLLMENT: 1n << 7n,
  CREATE_LESSON:      1n << 8n,
  CREATE_QUESTION:    1n << 9n,
  TAKE_TEST:          1n << 10n,
  POST_COMMENT:       1n << 11n,
  DELETE_ANY_COMMENT: 1n << 12n,
  MANAGE_USERS:       1n << 13n,
  MANAGE_ROLES:       1n << 14n,
} as const;

export function usePermission(permission: bigint): boolean {
  const { user } = useAuth();
  if (!user) return false;
  // bitmask is on user.roles — for now, derive from role names
  const bitmask = rolesToBitmask(user.roles ?? []);
  return (bitmask & permission) !== 0n;
}

function rolesToBitmask(roles: string[]): bigint {
  const presets: Record<string, bigint> = {
    student:    3136n,
    instructor: 4051n,
    admin:      ~0n,
  };
  return roles.reduce((acc, r) => acc | (presets[r] ?? 0n), 0n);
}
```

### Task 3 — `UserCard` component
File: `src/components/UserCard.tsx`

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserDto } from '@/dtos';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

export function UserCard({ user }: { user: UserDto }) {
  return (
    <Link to={ROUTES.PROFILE(user.id)} className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.avatarUrl ?? undefined} />
        <AvatarFallback>{user.displayName[0]}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium text-foreground">{user.displayName}</p>
        <p className="text-sm text-muted-foreground">@{user.username}</p>
      </div>
    </Link>
  );
}
```

---

## ✅ End-of-Day Checklist

- [ ] `GET /api/users/{id}` returns user JSON with correct shape
- [ ] `PATCH /api/users/{id}` updates display_name and username
- [ ] Duplicate username returns `409 Conflict` with error message
- [ ] Profile page shows skeleton while loading, error message on failure
- [ ] Avatar upload flow: select file → upload to Cloudinary → Navbar avatar updates
- [ ] `usePermission(PERMISSION.CREATE_COURSE)` returns `true` for instructor, `false` for student in browser
- [ ] Dark mode looks correct on profile page
