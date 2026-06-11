import { http, HttpResponse } from 'msw';
// Wait, let's check how other handlers store data. I will use a simple in-memory array for sessions and answers.

// Actually, I should use sessionStorage to keep the session alive across reloads!
const getSessions = () => {
  const str = sessionStorage.getItem('mock_sessions');
  return str ? JSON.parse(str) : [];
};

const saveSessions = (data: unknown) => {
  sessionStorage.setItem('mock_sessions', JSON.stringify(data));
};

const getAnswers = () => {
  const str = sessionStorage.getItem('mock_answers');
  return str ? JSON.parse(str) : {};
};

const saveAnswers = (data: unknown) => {
  sessionStorage.setItem('mock_answers', JSON.stringify(data));
};

export const testsHandlers = [
  // Lấy chi tiết Test
  http.get('/api/tests/:testId', async ({ params }) => {
    // Return a dummy test details
    return HttpResponse.json({
      id: params.testId,
      timeLimit: 1800, // 30 minutes by default
      statement: 'Bài kiểm tra trắc nghiệm',
    });
  }),

  // Lấy danh sách câu hỏi cho Student (ẩn correctChoices)
  http.get('/api/tests/:testId/questions', async () => {
    // Generate some dummy questions
    const questions = [
      {
        id: 'q1',
        statement: 'React là thư viện của công ty nào?',
        questionType: 'multiple_choice',
        choices: ['Google', 'Meta (Facebook)', 'Microsoft', 'Twitter'],
        isSingleChoice: true,
      },
      {
        id: 'q2',
        statement: 'Các hook cơ bản trong React là gì? (Chọn nhiều)',
        questionType: 'multiple_choice',
        choices: ['useState', 'useForm', 'useEffect', 'useMouse'],
        isSingleChoice: false,
      },
      {
        id: 'q3',
        statement: 'TypeScript có hỗ trợ interface không?',
        questionType: 'multiple_choice',
        choices: ['Có', 'Không'],
        isSingleChoice: true,
      },
    ];
    return HttpResponse.json(questions);
  }),

  // Thêm câu hỏi vào đề thi
  http.post('/api/tests/:testId/questions', async () => {
    return HttpResponse.json({ success: true }, { status: 201 });
  }),

  // Xóa câu hỏi khỏi đề thi
  http.delete('/api/tests/:testId/questions/:questionId', async () => {
    return HttpResponse.json({ success: true });
  }),

  // Cập nhật điểm câu hỏi
  http.patch('/api/tests/:testId/questions/:questionId', async () => {
    return HttpResponse.json({ success: true });
  }),

  // Lưu cài đặt test
  http.put('/api/lessons/:lessonId/test', async () => {
    return HttpResponse.json({ success: true });
  }),

  // Bắt đầu hoặc tiếp tục Test Session
  http.post('/api/tests/:testId/sessions', async ({ params }) => {
    const { testId } = params;
    const userId = 'user-1'; // Mock user

    const sessions = getSessions();
    const timeLimit = 1800; // 30 mins

    const existing = sessions.find(
      (s: Record<string, unknown>) => s.testId === testId && s.userId === userId && !s.isDone,
    );

    if (existing) {
      // Resume
      const elapsed = Math.floor(Date.now() / 1000) - (existing.startedAtTs as number);
      const remaining = Math.max(0, timeLimit - elapsed);
      return HttpResponse.json({
        ...existing,
        remainingTime: remaining,
      });
    }

    // Check if already submitted (for simplicity, we assume one attempt or new attempt if done)
    // Actually day 09 says "if existsByUserId...isDoneTrue return 409 already submitted".
    const submitted = sessions.find(
      (s: Record<string, unknown>) => s.testId === testId && s.userId === userId && s.isDone,
    );
    if (submitted) {
      return new HttpResponse(null, { status: 409, statusText: 'Already submitted' });
    }

    const newSession = {
      id: `session-${Date.now()}`,
      userId,
      testId,
      startedAt: new Date().toISOString(),
      startedAtTs: Math.floor(Date.now() / 1000),
      submittedAt: null,
      isDone: false,
      createdAt: new Date().toISOString(),
    };

    sessions.push(newSession);
    saveSessions(sessions);

    return HttpResponse.json(
      {
        ...newSession,
        remainingTime: timeLimit,
      },
      { status: 201 },
    );
  }),

  // Lấy câu trả lời hiện tại của session (để restore khi f5)
  http.get('/api/tests/sessions/:sessionId/answers', async ({ params }) => {
    const { sessionId } = params;
    const answers = getAnswers();
    return HttpResponse.json(answers[sessionId as string] || {});
  }),

  // Lưu câu trả lời
  http.put('/api/tests/sessions/:sessionId/answers/:questionId', async ({ params, request }) => {
    const { sessionId, questionId } = params;
    const data = (await request.json()) as { answer: number[] };

    const answers = getAnswers();
    if (!answers[sessionId as string]) {
      answers[sessionId as string] = {};
    }
    answers[sessionId as string][questionId as string] = data.answer;
    saveAnswers(answers);

    return HttpResponse.json({ success: true });
  }),

  // Nộp bài
  http.post('/api/tests/sessions/:sessionId/submit', async ({ params }) => {
    const { sessionId } = params;
    const sessions = getSessions();
    const session = sessions.find((s: Record<string, unknown>) => s.id === sessionId);

    if (!session) return new HttpResponse(null, { status: 404 });

    session.isDone = true;
    session.submittedAt = new Date().toISOString();
    saveSessions(sessions);

    return HttpResponse.json({ success: true, sessionId });
  }),
];
