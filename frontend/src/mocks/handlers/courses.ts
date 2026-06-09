import { http, HttpResponse, delay } from 'msw';
import type { CourseDto, UserDto } from '@/types';

// ── Fake Data ─────────────────────────────────────────────────

const mockAuthors: UserDto[] = [
  { id: '1', displayName: 'Nguyễn Công Vinh', username: 'vinh_nc', avatarUrl: null },
  { id: '2', displayName: 'Lê Thành Trung', username: 'trung_lt', avatarUrl: null },
  { id: '3', displayName: 'Trần Tuấn Anh', username: 'anh_tt', avatarUrl: null },
];

const mockCourses: CourseDto[] = Array.from({ length: 15 }, (_, i) => ({
  id: String(i + 1),
  title: [
    'Nhập Môn Lập Trình React 19',
    'Thiết Kế UX/UI Hiện Đại',
    'Kiến Trúc Backend với Spring Boot',
    'Cấu Trúc Dữ Liệu & Giải Thuật',
    'Machine Learning Cơ Bản',
    'DevOps & CI/CD Pipeline',
    'Lập Trình Mobile với React Native',
    'An Toàn Thông Tin & Bảo Mật Web',
    'Database Design & Optimization',
    'TypeScript Nâng Cao',
    'Docker & Kubernetes Thực Chiến',
    'Toán Rời Rạc cho CNTT',
    'Phát Triển API RESTful',
    'Testing & QA Automation',
    'Quản Lý Dự Án Phần Mềm',
  ][i],
  description:
    'Khóa học chất lượng cao với nội dung thực tiễn, bài tập phong phú và hỗ trợ từ giảng viên.',
  thumbnailUrl: null,
  isPublished: i < 12,
  visibility: i < 10 ? 'public' : i < 13 ? 'restricted' : 'private',
  author: mockAuthors[i % mockAuthors.length],
  createdAt: new Date(2026, 4, 1 + i).toISOString(),
  updatedAt: new Date(2026, 4, 20 + (i % 5)).toISOString(),
}));

export const courseHandlers = [
  // ── GET /api/courses (paginated, searchable) ───────────────
  http.get('/api/courses', async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 0);
    const size = Number(url.searchParams.get('size') ?? 12);
    const search = url.searchParams.get('search') ?? '';
    const visibility = url.searchParams.get('visibility') ?? 'public';
    const own = url.searchParams.get('own') === 'true';

    let filtered = mockCourses;
    if (own) {
      // Current mock user is vinh_nc (id: '1')
      filtered = filtered.filter((c) => c.author.id === '1');
    }
    if (visibility) {
      filtered = filtered.filter((c) => c.visibility === visibility);
    }
    // Only check isPublished for general public/restricted queries (not for own drafts)
    if (!own) {
      filtered = filtered.filter((c) => c.isPublished);
    }

    if (search) {
      filtered = filtered.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));
    }

    const start = page * size;
    const slice = filtered.slice(start, start + size);

    return HttpResponse.json({
      content: slice,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
      number: page,
      size,
      first: page === 0,
      last: start + size >= filtered.length,
      empty: slice.length === 0,
    });
  }),

  // ── GET /api/courses/:id ───────────────────────────────────
  http.get('/api/courses/:id', async ({ params }) => {
    await delay(200);
    const course = mockCourses.find((c) => c.id === params.id);
    if (!course) return HttpResponse.json(null, { status: 404 });
    return HttpResponse.json(course);
  }),

  // ── POST /api/courses ──────────────────────────────────────
  http.post('/api/courses', async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Record<string, unknown>;
    const newCourse: CourseDto = {
      id: String(Date.now()),
      title: (body.title as string) || 'Untitled',
      description: (body.description as string) || '',
      thumbnailUrl: (body.thumbnailUrl as string) || null,
      isPublished: false,
      visibility: (body.visibility as CourseDto['visibility']) || 'public',
      author: mockAuthors[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(newCourse, { status: 201 });
  }),

  // ── PATCH /api/courses/:id ──────────────────────────────────
  http.patch('/api/courses/:id', async ({ request, params }) => {
    await delay(300);
    const body = (await request.json()) as Partial<CourseDto>;
    const courseIndex = mockCourses.findIndex((c) => c.id === params.id);
    if (courseIndex === -1) return HttpResponse.json(null, { status: 404 });

    mockCourses[courseIndex] = {
      ...mockCourses[courseIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(mockCourses[courseIndex]);
  }),

  // ── GET /api/courses/:id/access-status ─────────────────────
  http.get('/api/courses/:id/access-status', async () => {
    await delay(200);
    return HttpResponse.json({ status: 'none' });
  }),

  // ── POST /api/courses/:id/enroll ───────────────────────────
  http.post('/api/courses/:id/enroll', async () => {
    await delay(300);
    return new HttpResponse(null, { status: 201 });
  }),

  // ── POST /api/courses/:id/access-requests ──────────────────
  http.post('/api/courses/:id/access-requests', async () => {
    await delay(300);
    return new HttpResponse(null, { status: 201 });
  }),
];
