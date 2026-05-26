import { http, HttpResponse, delay } from 'msw';
import type { QuestionDto } from '@/types';

const mockQuestions: QuestionDto[] = [
  {
    id: 501,
    statement: 'React hook nào dùng để quản lý state?',
    questionType: 'multiple_choice',
    choices: ['useEffect', 'useState', 'useRef', 'useMemo'],
    correctChoices: [1],
    isSingleChoice: true,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
  },
  {
    id: 502,
    statement: 'Đâu là cách đúng để truyền data xuống component con?',
    questionType: 'multiple_choice',
    choices: ['Context', 'Props', 'Redux', 'Global variable'],
    correctChoices: [1],
    isSingleChoice: true,
    createdAt: '2026-05-02T00:00:00Z',
    updatedAt: '2026-05-02T00:00:00Z',
  },
  {
    id: 503,
    statement: 'Chọn các lifecycle hook trong React (chọn nhiều)',
    questionType: 'multiple_choice',
    choices: ['useEffect', 'componentDidMount', 'useLayoutEffect', 'ngOnInit'],
    correctChoices: [0, 1, 2],
    isSingleChoice: false,
    createdAt: '2026-05-03T00:00:00Z',
    updatedAt: '2026-05-03T00:00:00Z',
  },
];

export const questionHandlers = [
  // ── GET /api/questions (paginated) ─────────────────────────
  http.get('/api/questions', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const search = url.searchParams.get('search') ?? '';
    const filtered = search
      ? mockQuestions.filter((q) => q.statement.toLowerCase().includes(search.toLowerCase()))
      : mockQuestions;
    return HttpResponse.json({
      content: filtered,
      totalElements: filtered.length,
      totalPages: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
      empty: filtered.length === 0,
    });
  }),

  // ── POST /api/questions ────────────────────────────────────
  http.post('/api/questions', async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: Date.now(),
        ...body,
        questionType: 'multiple_choice',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  // ── DELETE /api/questions/:id ──────────────────────────────
  http.delete('/api/questions/:id', async () => {
    await delay(200);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── GET /api/tests/:id/questions ───────────────────────────
  http.get('/api/tests/:testId/questions', async () => {
    await delay(300);
    return HttpResponse.json(mockQuestions.map((q, i) => ({ ...q, point: 1, order: i })));
  }),

  // ── POST /api/tests/:id/questions ──────────────────────────
  http.post('/api/tests/:testId/questions', async () => {
    await delay(200);
    return new HttpResponse(null, { status: 201 });
  }),

  // ── POST /api/tests/:id/sessions (start quiz) ─────────────
  http.post('/api/tests/:testId/sessions', async () => {
    await delay(300);
    return HttpResponse.json(
      {
        id: Date.now(),
        userId: 1,
        testId: 1003,
        startedAt: new Date().toISOString(),
        isDone: false,
        remainingTime: 1800,
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  // ── PUT /api/sessions/:id/answers (autosave) ──────────────
  http.put('/api/sessions/:sessionId/answers', async () => {
    await delay(100);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── POST /api/sessions/:id/submit ─────────────────────────
  http.post('/api/sessions/:sessionId/submit', async ({ params }) => {
    await delay(500);
    return HttpResponse.json({
      sessionId: Number(params.sessionId),
      totalScore: 8,
      maxScore: 10,
      percent: 80,
      duration: 540,
      answers: mockQuestions.map((q) => ({
        questionId: q.id,
        statement: q.statement,
        choices: q.choices,
        correctChoices: q.correctChoices,
        studentAnswer: String(q.correctChoices[0]),
        isCorrect: true,
        point: 1,
      })),
    });
  }),
];
