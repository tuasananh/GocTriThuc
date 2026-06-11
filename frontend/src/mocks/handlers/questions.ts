import { http, HttpResponse, delay } from 'msw';
import type { QuestionDto } from '@/types';

const mockQuestions: QuestionDto[] = [
  {
    id: '501',
    statement: 'React hook nào dùng để quản lý state?',
    questionType: 'multiple_choice',
    choices: ['useEffect', 'useState', 'useRef', 'useMemo'],
    correctChoices: [1],
    isSingleChoice: true,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
  },
  {
    id: '502',
    statement: 'Đâu là cách đúng để truyền data xuống component con?',
    questionType: 'multiple_choice',
    choices: ['Context', 'Props', 'Redux', 'Global variable'],
    correctChoices: [1],
    isSingleChoice: true,
    createdAt: '2026-05-02T00:00:00Z',
    updatedAt: '2026-05-02T00:00:00Z',
  },
  {
    id: '503',
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
        id: String(Date.now()),
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

  // ── PUT /api/questions/:id ─────────────────────────────────────────────────
  http.put('/api/questions/:id', async ({ request, params }) => {
    await delay(300);
    const body = (await request.json()) as Record<string, unknown>;
    const existing = mockQuestions.find((q) => q.id === params.id);
    return HttpResponse.json({
      ...(existing ?? {}),
      id: params.id,
      ...body,
      questionType: 'multiple_choice',
      updatedAt: new Date().toISOString(),
    });
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

  // ── DELETE /api/tests/:testId/questions/:questionId ─────────
  http.delete('/api/tests/:testId/questions/:questionId', async () => {
    await delay(200);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── POST /api/tests/:id/sessions (start quiz) ─────────────
  http.post('/api/tests/:testId/sessions', async ({ params }) => {
    await delay(300);
    return HttpResponse.json(
      {
        id: String(Date.now()),
        userId: '1',
        testId: params.testId as string,
        startedAt: new Date().toISOString(),
        submittedAt: null,
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
      sessionId: params.sessionId as string,
      totalScore: 8,
      maxScore: 10,
      percent: 80,
      duration: 540,
      answers: mockQuestions.map((q) => ({
        questionId: q.id,
        statement: q.statement,
        choices: q.choices,
        correctChoices: q.correctChoices,
        studentAnswer: [q.correctChoices[0]],
        isCorrect: true,
        point: 1,
      })),
    });
  }),

  // ── GET /api/sessions/:sessionId/result ─────────────────────────
  http.get('/api/sessions/:sessionId/result', async ({ params }) => {
    await delay(500);
    return HttpResponse.json({
      sessionId: params.sessionId as string,
      totalScore: 8,
      maxScore: 10,
      percent: 80,
      duration: 540,
      answers: mockQuestions.map((q, i) => ({
        questionId: q.id,
        statement: q.statement,
        choices: q.choices,
        correctChoices: q.correctChoices,
        // Make the second question incorrect for demonstration purposes
        studentAnswer: i === 1 ? [q.choices.length > 2 ? 2 : 0] : [q.correctChoices[0]],
        isCorrect: i !== 1,
        point: i === 1 ? 0 : 1,
      })),
    });
  }),
];
