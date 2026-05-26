# 🎨 Hướng Dẫn Frontend — GocTriThuc

> **Đọc trước khi code.** Tài liệu này giải thích cách sử dụng khung chung (shared framework) để team FE code nhanh, nhất quán và không conflict.

---

## 📂 Cấu Trúc Thư Mục

```
src/
├── components/               ← Components dùng chung TOÀN APP
│   ├── ui/                   ← shadcn/ui primitives (KHÔNG sửa trực tiếp)
│   ├── PageShell.tsx          ← Wrapper layout cho mọi trang
│   ├── SectionHeader.tsx      ← Tiêu đề + description + action button
│   ├── EmptyState.tsx         ← Hiển thị khi không có data
│   ├── ErrorState.tsx         ← Hiển thị lỗi + nút Thử lại
│   ├── SkeletonCard.tsx       ← Loading skeleton cards/rows
│   ├── RoleBadge.tsx          ← Badge role (Admin/Giảng viên/Học viên)
│   ├── ProtectedRoute.tsx     ← Route guard (cần đăng nhập)
│   ├── GuestRoute.tsx         ← Route guard (chỉ cho guest)
│   ├── GocTriThuc.tsx         ← Logo component
│   └── rich-text-editor/      ← BlockNote editor
│
├── types/                    ← TypeScript types (API contract)
│   ├── api.ts                 ← PageResponse<T>, ApiError
│   ├── user.ts                ← UserDto, UpdateUserRequest
│   ├── course.ts              ← CourseDto, ModuleDto, LessonDto...
│   ├── question.ts            ← QuestionDto, TestSessionDto...
│   ├── comment.ts             ← CommentDto, AnnouncementDto
│   ├── file.ts                ← FileDto, fileServeUrl()
│   └── index.ts               ← Barrel export (import từ '@/types')
│
├── lib/                      ← Utilities dùng chung
│   ├── api.ts                 ← Axios instance (LUÔN dùng cái này)
│   ├── routes.ts              ← Route path constants
│   ├── permissions.ts         ← Permission bits + usePermission hook
│   └── utils.ts               ← cn() helper
│
├── mocks/                    ← MSW mock handlers
│   ├── browser.ts             ← MSW worker setup
│   ├── handlers.ts            ← Gom tất cả handlers
│   └── handlers/              ← Tách theo domain
│       ├── courses.ts
│       ├── modules.ts
│       ├── questions.ts
│       └── files.ts
│
├── pages/                    ← Mỗi trang 1 thư mục
│   ├── courses/               ← /courses
│   │   ├── index.tsx           ← CourseListPage (trang chính)
│   │   └── _components/        ← Components riêng cho trang này
│   │       ├── CourseCard.tsx
│   │       └── CreateCourseModal.tsx
│   ├── instructor/            ← /instructor/*
│   │   ├── index.tsx
│   │   └── _components/
│   └── admin/                 ← /admin/*
│
├── contexts/                 ← React Context
├── providers/                ← Context Providers
└── layouts/                  ← Layout shells
```

---

## 🚨 Quy Tắc Quan Trọng

### 1. GỌI API — Luôn dùng `api` từ `@/lib/api`

```tsx
// ✅ ĐÚNG
import { api } from '@/lib/api';
const res = await api.get<PageResponse<CourseDto>>('/api/courses');

// ❌ SAI — KHÔNG import axios trực tiếp
import axios from 'axios';
const res = await axios.get('/api/courses');
```

**Lý do:** `api` đã có sẵn interceptor xử lý lỗi 401 (redirect login), 403 (toast warning), 500 (toast error).

### 2. IMPORT TYPES — Luôn import từ `@/types`

```tsx
// ✅ ĐÚNG
import type { CourseDto, PageResponse } from '@/types';

// ❌ SAI — KHÔNG tự define types inline
interface Course { id: number; title: string; ... }
```

### 3. ĐƯỜNG DẪN — Luôn dùng `ROUTES` từ `@/lib/routes`

```tsx
// ✅ ĐÚNG
import { ROUTES } from '@/lib/routes';
<Link to={ROUTES.COURSE_DETAIL(course.id)}>Xem chi tiết</Link>
navigate(ROUTES.COURSES);

// ❌ SAI — KHÔNG hardcode path
<Link to={`/courses/${course.id}`}>
```

### 4. PHÂN QUYỀN — Dùng `usePermission` hook

```tsx
import { usePermission, PERMISSION } from '@/lib/permissions';

function CourseListPage() {
  const canCreateCourse = usePermission(PERMISSION.MANAGE_COURSES);

  return (
    <PageShell>
      <SectionHeader
        title="Khóa học"
        action={canCreateCourse && <Button>Tạo khóa học</Button>}
      />
    </PageShell>
  );
}
```

### 5. TOAST — Dùng `toast` từ `sonner`

```tsx
import { toast } from 'sonner';

// Thành công
toast.success('Tạo khóa học thành công!');

// Lỗi (thường không cần vì api interceptor đã xử lý)
toast.error('Tạo thất bại. Vui lòng thử lại.');
```

---

## 📐 Template Trang Mới

Khi tạo trang mới, copy template này:

```tsx
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { PageResponse, CourseDto } from '@/types';
import { PageShell } from '@/components/PageShell';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonCard } from '@/components/SkeletonCard';
import { BookOpen } from 'lucide-react';

export function MyNewPage() {
  const [data, setData] = useState<CourseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PageResponse<CourseDto>>('/api/courses');
      setData(res.data.content);
    } catch {
      setError('Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <PageShell>
      <SectionHeader title="Tên trang" description="Mô tả ngắn" />

      {/* Loading state */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Error state */}
      {error && <ErrorState message={error} onRetry={fetchData} />}

      {/* Empty state */}
      {!loading && !error && data.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="Chưa có dữ liệu"
          description="Hãy tạo mục đầu tiên"
        />
      )}

      {/* Data state */}
      {!loading && !error && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => (
            <div key={item.id}>{item.title}</div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
```

**Mỗi trang PHẢI xử lý 4 trạng thái:** Loading → Error → Empty → Data.

---

## 🧪 Mock API (MSW)

### Bật/Tắt Mock

Mở `src/main.tsx` — MSW đã được cấu hình sẵn. Khi backend chưa sẵn sàng, MSW sẽ chặn request và trả về mock data.

### Đổi trạng thái auth

*   **Đăng nhập / Đăng xuất:** Bạn **không cần** phải sửa code để test luồng đăng nhập/đăng xuất nữa. Bạn có thể click trực tiếp nút **Đăng xuất** trên thanh Header hoặc nút **Đăng nhập với Google/GitHub** trên giao diện Login. Hệ thống sẽ tự động lưu và cập nhật trạng thái đăng nhập vào `localStorage` của trình duyệt.
*   **Thay đổi Quyền hạn (Roles/Permissions):** Để test giao diện hiển thị cho Học viên (`student`) hoặc Quản trị viên (`admin`), hãy mở `src/mocks/handlers.ts`, tìm `authHandlers` và chỉnh sửa:
    ```ts
    // Đổi roles để test giao diện tương ứng: ['student'] hoặc ['admin'] hoặc ['teacher']
    roles: ['teacher'],
    // Đổi permissions (BigInt dạng chuỗi): '62' (0x3E) = teacher, '1' = admin, v.v.
    permissions: '62',
    ```

### Thêm mock handler mới

Tạo file trong `src/mocks/handlers/`, rồi import vào `handlers.ts`:

```ts
// src/mocks/handlers/announcements.ts
import { http, HttpResponse, delay } from 'msw';

export const announcementHandlers = [
  http.get('/api/courses/:id/announcements', async () => {
    await delay(300);
    return HttpResponse.json([...]);
  }),
];
```

```ts
// src/mocks/handlers.ts — thêm import
import { announcementHandlers } from './handlers/announcements';

export const handlers = [
  ...authHandlers,
  ...courseHandlers,
  ...announcementHandlers, // ← thêm vào đây
];
```

---

## 🧩 shadcn/ui Components Đã Cài

Các component có sẵn (import từ `@/components/ui/*`):

| Component | Dùng cho |
|---|---|
| `button` | Nút bấm |
| `card` | Card container |
| `badge` | Label/tag |
| `avatar` | Ảnh đại diện |
| `input` | Ô nhập text |
| `textarea` | Ô nhập text nhiều dòng |
| `label` | Label cho form |
| `skeleton` | Loading placeholder |
| `dialog` | Modal popup |
| `select` | Dropdown chọn |
| `tabs` | Tab navigation |
| `switch` | Toggle on/off |
| `sheet` | Drawer/sidebar |
| `tooltip` | Popup khi hover |
| `progress` | Thanh tiến trình |
| `sonner` | Toast notifications |
| `separator` | Đường kẻ phân cách |
| `dropdown-menu` | Menu dropdown |

**Cần thêm component khác?** Chạy:
```bash
pnpm dlx shadcn@latest add <tên-component>
```

---

## 🎨 Quy Tắc UI/UX

1. **Micro-animations:** Thêm `transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg` cho cards
2. **Responsive:** Luôn code mobile-first: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
3. **Dark mode:** Dùng CSS variables: `text-foreground`, `bg-background`, `text-muted-foreground`
4. **Glassmorphism:** Cho header/modal: `bg-background/80 backdrop-blur-md`
5. **Naming:** File page = `index.tsx`, components riêng = thư mục `_components/`
6. **IDs:** Tất cả buttons/inputs cần có `id` duy nhất (cho testing)

---

## 📝 Checklist Trước Khi Tạo PR

- [ ] Import types từ `@/types`, không define inline
- [ ] Gọi API bằng `api` từ `@/lib/api`, không dùng `axios` trực tiếp
- [ ] Dùng `ROUTES.*` cho đường dẫn, không hardcode
- [ ] Trang xử lý đủ 4 states: Loading / Error / Empty / Data
- [ ] Responsive: test ở 375px, 768px, 1280px
- [ ] Chạy `pnpm run lint` và `pnpm run format` trước khi commit
