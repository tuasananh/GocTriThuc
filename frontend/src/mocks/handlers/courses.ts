import { http, HttpResponse, delay } from 'msw';
import type { CourseDto } from '@/types';

const mockAuthors = [
  { id: '1', displayName: 'Phạm Văn Sâm', username: 'sam_pv', avatarUrl: null },
  { id: '2', displayName: 'Lê Thành Trung', username: 'trung_lt', avatarUrl: null },
  { id: '3', displayName: 'Trần Tuấn Anh', username: 'anh_tt', avatarUrl: null },
  { id: '4', displayName: 'Nguyễn Công Vinh', username: 'vinh_nc', avatarUrl: null },
];

const titles = [
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
];

const mockCourses: CourseDto[] = Array.from({ length: titles.length }, (_, i) => ({
  id: String(i + 1),
  title: titles[i],
  description: 'Khóa học chất lượng cao với nội dung thực tiễn, bài tập phong phú và hỗ trợ từ giảng viên.',
  thumbnailUrl: null,
  isPublished: i < 12,
  visibility: i < 10 ? 'public' : i < 13 ? 'restricted' : 'private',
  author: mockAuthors[i % mockAuthors.length],
  createdAt: new Date(2026, 4, 1 + i).toISOString(),
  updatedAt: new Date(2026, 4, 20 + (i % 5)).toISOString(),
}));

export const courseHandlers = [
  // ── GET /api/courses ───────────────────────────────────────
  http.get('/api/courses', async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 0);
    const size = Number(url.searchParams.get('size') ?? 12);
    const search = url.searchParams.get('search') ?? '';
    const visibility = url.searchParams.get('visibility') ?? 'public';
    
    const filtered = mockCourses.filter(
      (c) =>
        c.title.toLowerCase().includes(search.toLowerCase()) &&
        c.visibility === visibility
    );
    const slice = filtered.slice(page * size, (page + 1) * size);
    
    return HttpResponse.json({
      content: slice,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
      number: page,
      size,
    });
  }),

  // ── GET /api/courses/:courseId ─────────────────────────────
  http.get('/api/courses/:courseId', async ({ params }) => {
    await delay(200);
    return HttpResponse.json(
      mockCourses.find((c) => c.id === String(params.courseId)) ?? null,
    );
  }),

  // ── POST /api/courses ──────────────────────────────────────
  http.post('/api/courses', async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ...mockCourses[0],
        ...body,
        id: '999',
      } as CourseDto,
      { status: 201 },
    );
  }),

  // ── Helper handlers (required for subsequent steps) ────────
  http.get('/api/courses/:id/access-status', async () => {
    await delay(200);
    return HttpResponse.json({ status: 'none' });
  }),

  http.post('/api/courses/:id/enroll', async () => {
    await delay(300);
    return new HttpResponse(null, { status: 201 });
  }),
];
