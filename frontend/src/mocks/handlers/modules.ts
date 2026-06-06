import { http, HttpResponse, delay } from 'msw';
import type { ModuleDto, LessonDetailDto } from '@/types';

const completedLessonsMap = new Map<string, boolean>();

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
    let foundLesson: any = null;
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
      createdAt: '2026-05-01T00:00:00Z',
      updatedAt: '2026-05-01T00:00:00Z',
    };

    if (lessonType === 'video') {
      detail.video = {
        provider: 'youtube',
        providerValue: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };
    } else if (lessonType === 'blog') {
      detail.blog = {
        content: '<h2>Nội dung bài giảng</h2><p>Đây là nội dung blog mẫu.</p>',
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
