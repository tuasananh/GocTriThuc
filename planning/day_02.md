# Day 2 — Authentication

**Goal**: Users can log in via Google OAuth2. The app knows who is logged in. All protected routes redirect guests to `/login`.
**Unblocks**: Everything requiring a logged-in user (Days 3–10).
**Done when**: A real Google login creates a user row in DB, `GET /api/auth/me` returns user JSON, frontend stores auth state and gates routes.

---

## 🔴 Trung (BE Lead)

### Task 1 — User entity & repository
File: `com/goctrithuc/users/UserEntity.java`

```java
package com.goctrithuc.users;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "users")
public class UserEntity {
  @Id private Long id;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(name = "display_name", nullable = false)
  private String displayName;

  @Column(nullable = false, unique = true)
  private String username;

  @Column(name = "avatar_url")
  private String avatarUrl;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  // standard getters/setters
}
```

File: `com/goctrithuc/users/UserRepository.java`

```java
package com.goctrithuc.users;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
  Optional<UserEntity> findByEmail(String email);
  boolean existsByUsername(String username);
}
```

### Task 2 — UserProviderEntity & repository
File: `com/goctrithuc/auth/UserProviderEntity.java`

```java
@Entity
@Table(name = "user_providers")
public class UserProviderEntity {
  @Id private Long id;
  @Column(name = "user_id") private Long userId;
  private String provider;               // e.g. "google"
  @Column(name = "provider_account_id") private String providerAccountId;
  private Instant createdAt;
  private Instant updatedAt;
  // getters/setters
}
```

### Task 3 — OAuth2 success handler (upsert user)
File: `com/goctrithuc/auth/OAuth2SuccessHandler.java`

```java
@Component
public class OAuth2SuccessHandler extends SavedRequestAwareAuthenticationSuccessHandler {

  private final UserService userService;

  public OAuth2SuccessHandler(UserService userService) {
    this.userService = userService;
    setDefaultTargetUrl("/");     // redirect frontend root after login
    setAlwaysUseDefaultTargetUrl(false);
  }

  @Override
  public void onAuthenticationSuccess(
      HttpServletRequest req, HttpServletResponse res, Authentication auth)
      throws IOException, ServletException {
    OAuth2User oAuth2User = (OAuth2User) auth.getPrincipal();
    userService.upsertFromOAuth(oAuth2User, "google");
    super.onAuthenticationSuccess(req, res, auth);
  }
}
```

### Task 4 — UserService.upsertFromOAuth
File: `com/goctrithuc/users/UserService.java`

```java
@Service
@Transactional
public class UserService {

  private final UserRepository userRepo;
  private final UserProviderRepository providerRepo;
  private final RoleRepository roleRepo;
  private final UserRoleRepository userRoleRepo;
  private final IdGenerator idGenerator; // use Snowflake or DB sequence

  public UserEntity upsertFromOAuth(OAuth2User oAuth2User, String provider) {
    String email = oAuth2User.getAttribute("email");
    String name  = oAuth2User.getAttribute("name");
    String picture = oAuth2User.getAttribute("picture");
    String providerAccountId = oAuth2User.getName(); // Google sub

    UserEntity user = userRepo.findByEmail(email).orElseGet(() -> {
      UserEntity u = new UserEntity();
      u.setId(idGenerator.nextId());
      u.setEmail(email);
      u.setDisplayName(name != null ? name : email);
      u.setUsername(generateUsername(email));
      u.setAvatarUrl(picture);
      u.setCreatedAt(Instant.now());
      u.setUpdatedAt(Instant.now());
      userRepo.save(u);
      // Assign default student role
      assignRole(u.getId(), "student");
      return u;
    });

    // Upsert provider record
    boolean hasProvider = providerRepo.existsByUserIdAndProvider(user.getId(), provider);
    if (!hasProvider) {
      UserProviderEntity p = new UserProviderEntity();
      p.setId(idGenerator.nextId());
      p.setUserId(user.getId());
      p.setProvider(provider);
      p.setProviderAccountId(providerAccountId);
      p.setCreatedAt(Instant.now());
      p.setUpdatedAt(Instant.now());
      providerRepo.save(p);
    }
    return user;
  }

  private String generateUsername(String email) {
    String base = email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "_");
    String candidate = base;
    int i = 1;
    while (userRepo.existsByUsername(candidate)) {
      candidate = base + i++;
    }
    return candidate;
  }

  private void assignRole(Long userId, String roleName) {
    UserRoleEntity ur = new UserRoleEntity();
    ur.setUserId(userId);
    ur.setRoleName(roleName);
    ur.setCreatedAt(Instant.now());
    ur.setUpdatedAt(Instant.now());
    userRoleRepo.save(ur);
  }
}
```

### Task 5 — `GET /api/auth/me` and `POST /api/auth/logout`
File: `com/goctrithuc/auth/AuthController.java`

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final UserService userService;

  @GetMapping("/me")
  public ResponseEntity<UserResponse> me(Authentication auth) {
    if (auth == null || !auth.isAuthenticated()) {
      return ResponseEntity.status(401).build();
    }
    OAuth2User principal = (OAuth2User) auth.getPrincipal();
    String email = principal.getAttribute("email");
    UserEntity user = userService.findByEmail(email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    return ResponseEntity.ok(UserResponse.from(user));
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(HttpServletRequest req, HttpServletResponse res,
      Authentication auth) {
    new SecurityContextLogoutHandler().logout(req, res, auth);
    return ResponseEntity.noContent().build();
  }
}
```

`UserResponse` record:
```java
public record UserResponse(
    Long id, String email, String displayName,
    String username, String avatarUrl, List<String> roles) {

  public static UserResponse from(UserEntity u) {
    // roles loaded separately via userRoleRepo
    return new UserResponse(
        u.getId(), u.getEmail(), u.getDisplayName(),
        u.getUsername(), u.getAvatarUrl(), List.of());
  }
}
```

### Task 6 — Integration tests
File: `AuthControllerTest.java` using `@SpringBootTest` + Testcontainers.
Test cases:
- `GET /api/auth/me` without session → 401
- After mock OAuth login → `GET /api/auth/me` returns user JSON
- `POST /api/auth/logout` → 204, then `GET /api/auth/me` → 401

---

## 🔴 Anh (BE Dev / PM)

### Task 1 — `PermissionService.java`
File: `com/goctrithuc/shared/PermissionService.java`

```java
@Service
public class PermissionService {

  private final UserRoleRepository userRoleRepo;
  private final RoleRepository roleRepo;

  // Returns combined bitmask of all roles the user has
  public long getBitmask(Long userId) {
    List<String> roleNames = userRoleRepo.findRoleNamesByUserId(userId);
    return roleRepo.findAllById(roleNames).stream()
        .mapToLong(RoleEntity::getPermissions)
        .reduce(0L, (a, b) -> a | b);
  }

  public boolean hasPermission(Long userId, long permission) {
    return Permission.has(getBitmask(userId), permission);
  }
}
```

### Task 2 — Wire `@PreAuthorize` on a test endpoint

Add a temporary test endpoint to verify the bitmask flow works end-to-end:

```java
@GetMapping("/api/test-permission")
@PreAuthorize("@permissionService.hasPermission(authentication.principal.id, T(com.goctrithuc.shared.Permission).CREATE_COURSE)")
public String testPermission() {
  return "You can create courses!";
}
```

Verify: student gets 403, instructor gets 200.

### Task 3 — Unit tests for `Permission.has()`
File: `PermissionTest.java`

```java
@Test void studentCanEnroll() {
  assertTrue(Permission.has(Permission.STUDENT_PERMISSIONS, Permission.ENROLL_COURSE));
}
@Test void studentCannotCreateCourse() {
  assertFalse(Permission.has(Permission.STUDENT_PERMISSIONS, Permission.CREATE_COURSE));
}
@Test void adminHasAll() {
  assertTrue(Permission.has(Permission.ADMIN_PERMISSIONS, Permission.MANAGE_ROLES));
}
```

### Task 4 — PM: Monitor Day 1 PRs
- Review and merge all Day 1 PRs.
- Confirm every member's environment is working.
- Post standup summary in team chat.

---

## 🔵 Vinh (FE Lead)

### Task 1 — Login page
File: `src/pages/login/LoginPage.tsx`

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/providers/AuthProvider';
import { Navigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') ?? ROUTES.HOME;

  if (!isLoading && isAuthenticated) {
    return <Navigate to={redirect} replace />;
  }

  const handleGoogleLogin = () => {
    // Spring Security OAuth2 redirect — we leave the SPA and let the backend handle it
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/google?redirect_uri=${encodeURIComponent(window.location.origin + redirect)}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Góc Tri Thức</CardTitle>
          <CardDescription>Đăng nhập để tiếp tục học tập</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            id="btn-google-login"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full gap-2"
            variant="outline"
          >
            {/* Google SVG icon */}
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>...</svg>
            Đăng nhập với Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Task 2 — Update `AuthProvider`
File: `src/providers/AuthProvider.tsx`

```tsx
import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';
import type { UserDto } from '@/dtos';

interface AuthContextValue {
  user: UserDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await api.get<UserDto>('/api/auth/me');
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMe(); }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, refetch: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
```

---

## 🔵 Sâm (FE Dev 1)

### Task 1 — `GuestRoute` component
File: `src/components/GuestRoute.tsx`

```tsx
import { useAuth } from '@/providers/AuthProvider';
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

// Only allows unauthenticated users. Redirects logged-in users to home.
export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to={ROUTES.HOME} replace />;
  return <Outlet />;
}
```

### Task 2 — `ProtectedRoute` component
File: `src/components/ProtectedRoute.tsx`

```tsx
import { useAuth } from '@/providers/AuthProvider';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return null; // or a full-page spinner
  if (!isAuthenticated) {
    return <Navigate
      to={`${ROUTES.LOGIN}?redirect=${encodeURIComponent(location.pathname)}`}
      replace
    />;
  }
  return <Outlet />;
}
```

### Task 3 — MSW handlers for auth
File: `src/mocks/handlers/auth.ts`

```typescript
import { http, HttpResponse } from 'msw';

const mockUser = {
  id: 1,
  email: 'vinh@example.com',
  displayName: 'Nguyễn Công Vinh',
  username: 'vinh_nc',
  avatarUrl: null,
  roles: ['instructor'],
};

export const authHandlers = [
  http.get('/api/auth/me', () => HttpResponse.json(mockUser)),
  http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
];
```

Add `authHandlers` to `src/mocks/handlers/index.ts`.

---

## 🔵 Tuấn (FE Dev 2)

### Task 1 — `Navbar` component
File: `src/components/Navbar.tsx`

```tsx
import { Link } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Moon, Sun } from 'lucide-react';
import api from '@/lib/api';

export function Navbar() {
  const { user, isAuthenticated, refetch } = useAuth();

  const logout = async () => {
    await api.post('/api/auth/logout');
    await refetch();
  };

  // Dark mode toggle — persisted in localStorage + html class
  const toggleTheme = () => {
    const html = document.documentElement;
    html.classList.toggle('dark');
    localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to={ROUTES.HOME} className="text-xl font-bold text-foreground">
          Góc Tri Thức
        </Link>

        <div className="flex items-center gap-3">
          <Link to={ROUTES.COURSES}>
            <Button variant="ghost" size="sm">Khóa học</Button>
          </Link>

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            <Sun size={18} className="dark:hidden" />
            <Moon size={18} className="hidden dark:block" />
          </Button>

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer h-8 w-8">
                  <AvatarImage src={user.avatarUrl ?? undefined} />
                  <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={ROUTES.PROFILE(user.id)}>Hồ sơ</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={ROUTES.DASHBOARD}>Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to={ROUTES.LOGIN}>
              <Button size="sm">Đăng nhập</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
```

### Task 2 — Add Navbar to `MainLayout`

```tsx
// src/layouts/MainLayout.tsx
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Outlet />
    </div>
  );
}
```

---

## ✅ End-of-Day Checklist

- [ ] Real Google login creates a `users` row + `user_providers` row in DB
- [ ] `GET /api/auth/me` returns `{ id, email, displayName, username, avatarUrl, roles }`
- [ ] `POST /api/auth/logout` clears session, subsequent `GET /api/auth/me` returns 401
- [ ] Visiting `/dashboard` while logged out redirects to `/login?redirect=/dashboard`
- [ ] After login, user is redirected back to the original page
- [ ] Navbar shows avatar + dropdown when logged in, "Đăng nhập" button when logged out
- [ ] Dark mode toggle works and persists on page refresh
- [ ] MSW mock for `GET /api/auth/me` returns the mock user in dev
