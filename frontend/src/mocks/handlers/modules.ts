import { http, HttpResponse, delay } from 'msw';
import type { ModuleDto, LessonDetailDto, LessonDto } from '@/types';

const completedLessonsMap = new Map<string, boolean>();
const lessonVideoMap = new Map<string, { provider: 'youtube' | 'vimeo'; providerValue: string }>();
const lessonBlogMap = new Map<string, string>();

// ── Fake modules & lessons ──────────────────────────────────

const mockModules: ModuleDto[] = [
  {
    id: '101',
    courseId: '1',
    title: 'Giới thiệu React',
    order: 0,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    lessons: [
      {
        id: '1001',
        title: 'React là gì?',
        lessonType: 'blog',
        order: 0,
        moduleId: '101',
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z',
      },
      {
        id: '1002',
        title: 'Cài đặt môi trường',
        lessonType: 'video',
        order: 1,
        moduleId: '101',
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z',
      },
      {
        id: '1003',
        title: 'Bài kiểm tra nhập môn',
        lessonType: 'test',
        order: 2,
        moduleId: '101',
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z',
      },
    ],
  },
  {
    id: '102',
    courseId: '1',
    title: 'Components & Props',
    order: 1,
    createdAt: '2026-05-02T00:00:00Z',
    updatedAt: '2026-05-02T00:00:00Z',
    lessons: [
      {
        id: '1004',
        title: 'Function Components',
        lessonType: 'blog',
        order: 0,
        moduleId: '102',
        createdAt: '2026-05-02T00:00:00Z',
        updatedAt: '2026-05-02T00:00:00Z',
      },
      {
        id: '1005',
        title: 'Props và State',
        lessonType: 'video',
        order: 1,
        moduleId: '102',
        createdAt: '2026-05-02T00:00:00Z',
        updatedAt: '2026-05-02T00:00:00Z',
      },
    ],
  },
];

export const moduleHandlers = [
  // ── GET /api/courses/:id/modules ─────────────────────────
  http.get('/api/courses/:courseId/modules', async () => {
    await delay(300);
    return HttpResponse.json(mockModules);
  }),

  // ── POST /api/courses/:id/modules ────────────────────────
  http.post('/api/courses/:courseId/modules', async ({ request, params }) => {
    await delay(300);
    const body = (await request.json()) as { title: string };
    const courseId = params.courseId as string;
    const newModule: ModuleDto = {
      id: String(Date.now()),
      courseId,
      title: body.title,
      order: mockModules.length,
      lessons: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(newModule, { status: 201 });
  }),

  // ── POST /api/modules/:id/lessons ────────────────────────
  http.post('/api/modules/:moduleId/lessons', async ({ request, params }) => {
    await delay(300);
    const body = (await request.json()) as { title: string; lessonType: string };
    const moduleId = params.moduleId as string;
    return HttpResponse.json(
      {
        id: String(Date.now()),
        title: body.title,
        lessonType: body.lessonType,
        order: 0,
        moduleId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  // ── GET /api/lessons/:id ─────────────────────────────────
  http.get('/api/lessons/:lessonId', async ({ params }) => {
    await delay(200);
    const id = params.lessonId as string;

    // Find in mockModules
    let foundLesson: LessonDto | null = null;
    for (const mod of mockModules) {
      const les = mod.lessons.find((l) => l.id === id);
      if (les) {
        foundLesson = les;
        break;
      }
    }

    const title = foundLesson ? foundLesson.title : 'Bài giảng mẫu';
    const lessonType = foundLesson ? foundLesson.lessonType : 'video';
    const moduleId = foundLesson ? foundLesson.moduleId : '101';
    const order = foundLesson ? foundLesson.order : 0;

    const detail: LessonDetailDto = {
      id,
      title,
      lessonType,
      order,
      moduleId,
      isCompleted: completedLessonsMap.get(id) || false,
      resources: [
        { id: 'file-react-1', filename: 'React-19-CheatSheet.pdf', url: '' },
        { id: 'file-react-2', filename: 'Thuc-hanh-Props-State.zip', url: '' },
      ],
      createdAt: '2026-05-01T00:00:00Z',
      updatedAt: '2026-05-01T00:00:00Z',
    };

    if (lessonType === 'video') {
      detail.video = lessonVideoMap.get(id) || {
        provider: 'youtube',
        providerValue: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };
    } else if (lessonType === 'blog') {
      detail.blog = {
        content:
          lessonBlogMap.get(id) || '<h2>Nội dung bài giảng</h2><p>Đây là nội dung blog mẫu.</p>',
      };
    } else if (lessonType === 'test') {
      detail.test = {
        testId: `test-${id}`,
        statement: 'Đây là bài kiểm tra mẫu. Chọn đáp án đúng cho các câu hỏi sau.',
        timeLimit: 1800,
      };
    }

    return HttpResponse.json(detail);
  }),

  // ── POST /api/lessons/:id/complete ───────────────────────
  http.post('/api/lessons/:lessonId/complete', async ({ params }) => {
    await delay(200);
    const id = params.lessonId as string;
    completedLessonsMap.set(id, true);
    return new HttpResponse(null, { status: 200 });
  }),

  // ── PATCH reorder ────────────────────────────────────────
  http.patch('/api/modules/:id/order', async () => {
    await delay(200);
    return new HttpResponse(null, { status: 204 });
  }),
  http.patch('/api/lessons/:id/order', async () => {
    await delay(200);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── PUT /api/modules/:id ──────────────────────────────────
  http.put('/api/modules/:id', async ({ request, params }) => {
    await delay(200);
    const body = (await request.json()) as { title: string };
    const id = params.id as string;
    const mod = mockModules.find((m) => m.id === id);
    if (mod) {
      mod.title = body.title;
      return HttpResponse.json(mod);
    }
    return HttpResponse.json({
      id,
      title: body.title,
      order: 0,
      lessons: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }),

  // ── PUT /api/lessons/:id ──────────────────────────────────
  http.put('/api/lessons/:id', async ({ request, params }) => {
    await delay(200);
    const body = (await request.json()) as { title: string };
    const id = params.id as string;
    for (const mod of mockModules) {
      const les = mod.lessons.find((l) => l.id === id);
      if (les) {
        les.title = body.title;
        return HttpResponse.json(les);
      }
    }
    return HttpResponse.json({
      id,
      title: body.title,
      lessonType: 'video',
      order: 0,
      moduleId: '101',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }),

  // ── PUT /api/lessons/:id/video ────────────────────────────
  http.put('/api/lessons/:id/video', async ({ request, params }) => {
    await delay(200);
    const body = (await request.json()) as { provider: 'youtube' | 'vimeo'; providerValue: string };
    const id = params.id as string;
    lessonVideoMap.set(id, body);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── PUT /api/lessons/:id/blog ─────────────────────────────
  http.put('/api/lessons/:id/blog', async ({ request, params }) => {
    await delay(200);
    const body = (await request.json()) as { content: string };
    const id = params.id as string;
    lessonBlogMap.set(id, body.content);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── PUT /api/lessons/:id/test ─────────────────────────────
  http.put('/api/lessons/:id/test', async ({ request, params }) => {
    await delay(200);
    const body = (await request.json()) as { statement: string; timeLimit: number };
    return HttpResponse.json({
      testId: `test-${params.id}`,
      ...body,
    });
  }),

  // ── DELETE ───────────────────────────────────────────────
  http.delete('/api/modules/:id', async () => {
    await delay(200);
    return new HttpResponse(null, { status: 204 });
  }),
  http.delete('/api/lessons/:id', async () => {
    await delay(200);
    return new HttpResponse(null, { status: 204 });
  }),
];
