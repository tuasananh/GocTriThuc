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

const currentUserId = '1';

const getMockEnrollments = (): Record<string, string[]> => {
  const str = sessionStorage.getItem('mock_enrollments');
  if (str) return JSON.parse(str);
  const defaults: Record<string, string[]> = {
    '1': ['1'],
    '2': ['1'],
    '3': ['1'],
  };
  sessionStorage.setItem('mock_enrollments', JSON.stringify(defaults));
  return defaults;
};

const saveMockEnrollments = (data: Record<string, string[]>) => {
  sessionStorage.setItem('mock_enrollments', JSON.stringify(data));
};

interface MockAccessRequest {
  userId: string;
  courseId: string;
  userDisplayName: string;
  requestedAt: string;
}

const getMockAccessRequests = (): MockAccessRequest[] => {
  const str = sessionStorage.getItem('mock_access_requests');
  if (str) return JSON.parse(str);
  const defaults = [
    {
      userId: '2',
      courseId: '4',
      userDisplayName: 'Học viên A',
      requestedAt: '2026-06-01T10:00:00Z',
    },
  ];
  sessionStorage.setItem('mock_access_requests', JSON.stringify(defaults));
  return defaults;
};

const saveMockAccessRequests = (data: MockAccessRequest[]) => {
  sessionStorage.setItem('mock_access_requests', JSON.stringify(data));
};

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
    const enrolled = url.searchParams.get('enrolled') === 'true';

    let filtered = mockCourses;
    if (own) {
      // Current mock user is vinh_nc (id: '1')
      filtered = filtered.filter((c) => c.author.id === '1');
    } else if (enrolled) {
      const enrollments = getMockEnrollments();
      const enrolledCourseIds: string[] = [];
      Object.entries(enrollments).forEach(([courseId, userIds]) => {
        if (userIds.includes(currentUserId)) {
          enrolledCourseIds.push(courseId);
        }
      });
      filtered = filtered.filter((c) => enrolledCourseIds.includes(c.id));
    }

    if (visibility && !enrolled) {
      filtered = filtered.filter((c) => c.visibility === visibility);
    }
    // Only check isPublished for general public/restricted queries (not for own drafts or enrolled)
    if (!own && !enrolled) {
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
  http.get('/api/courses/:id/access-status', async ({ params }) => {
    await delay(200);
    const courseId = params.id as string;
    const enrollments = getMockEnrollments();
    const enrolledUsers = enrollments[courseId] || [];
    if (enrolledUsers.includes(currentUserId)) {
      return HttpResponse.json({ status: 'enrolled' });
    }
    const requests = getMockAccessRequests();
    const hasRequest = requests.some((r) => r.courseId === courseId && r.userId === currentUserId);
    if (hasRequest) {
      return HttpResponse.json({ status: 'requested' });
    }
    return HttpResponse.json({ status: 'none' });
  }),

  // ── POST /api/courses/:id/enroll ───────────────────────────
  http.post('/api/courses/:id/enroll', async ({ params }) => {
    await delay(300);
    const courseId = params.id as string;
    const enrollments = getMockEnrollments();
    if (!enrollments[courseId]) {
      enrollments[courseId] = [];
    }
    if (!enrollments[courseId].includes(currentUserId)) {
      enrollments[courseId].push(currentUserId);
    }
    saveMockEnrollments(enrollments);
    return new HttpResponse(null, { status: 201 });
  }),

  // ── POST /api/courses/:id/access-requests ──────────────────
  http.post('/api/courses/:id/access-requests', async ({ params }) => {
    await delay(500);
    const courseId = params.id as string;
    const requests = getMockAccessRequests();
    const exists = requests.some((r) => r.courseId === courseId && r.userId === currentUserId);
    if (!exists) {
      requests.push({
        userId: currentUserId,
        courseId,
        userDisplayName: 'Ngô Bá Khá',
        requestedAt: new Date().toISOString(),
      });
      saveMockAccessRequests(requests);
    }
    return HttpResponse.json({}, { status: 201 });
  }),

  // ── GET /api/courses/:id/access-requests ───────────────────
  http.get('/api/courses/:id/access-requests', async ({ params }) => {
    await delay(300);
    const courseId = params.id as string;
    const requests = getMockAccessRequests();
    const courseRequests = requests.filter((r) => r.courseId === courseId);
    return HttpResponse.json(courseRequests);
  }),

  // ── POST /api/courses/:courseId/access-requests/:userId/approve ──
  http.post('/api/courses/:courseId/access-requests/:userId/approve', async ({ params }) => {
    await delay(300);
    const courseId = params.courseId as string;
    const userId = params.userId as string;

    let requests = getMockAccessRequests();
    requests = requests.filter((r) => !(r.courseId === courseId && r.userId === userId));
    saveMockAccessRequests(requests);

    const enrollments = getMockEnrollments();
    if (!enrollments[courseId]) {
      enrollments[courseId] = [];
    }
    if (!enrollments[courseId].includes(userId)) {
      enrollments[courseId].push(userId);
    }
    saveMockEnrollments(enrollments);

    return HttpResponse.json({}, { status: 201 });
  }),

  // ── DELETE /api/courses/:courseId/access-requests/:userId ──
  http.delete('/api/courses/:courseId/access-requests/:userId', async ({ params }) => {
    await delay(300);
    const courseId = params.courseId as string;
    const userId = params.userId as string;

    let requests = getMockAccessRequests();
    requests = requests.filter((r) => !(r.courseId === courseId && r.userId === userId));
    saveMockAccessRequests(requests);

    return HttpResponse.json({}, { status: 204 });
  }),

  // ── GET /api/courses/:id/progress ────────────────────────────
  http.get('/api/courses/:id/progress', async () => {
    await delay(300);
    return HttpResponse.json({
      completedLessons: 4,
      totalLessons: 10,
      percent: 40,
    });
  }),

  // ── POST /api/courses/:id/resources ────────────────────────
  http.post('/api/courses/:id/resources', async () => {
    await delay(200);
    return new HttpResponse(null, { status: 201 });
  }),
];
