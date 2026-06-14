import { http, HttpResponse } from 'msw';

// Sử dụng sessionStorage để lưu trữ tạm trạng thái phiên làm bài (session) và đáp án (answers).
// Việc này giúp sinh viên không bị mất dữ liệu hoặc trạng thái thời gian khi lỡ tay F5 (reload) trang.
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
  // Lấy chi tiết đề thi
  http.get('/api/tests/:testId', async ({ params }) => {
    const { testId } = params;
    return HttpResponse.json({
      id: testId,
      statement: 'Đây là bài kiểm tra mẫu. Chọn đáp án đúng cho các câu hỏi sau.',
      timeLimit: 1800,
    });
  }),

  // Lấy danh sách câu hỏi cho Student (ẩn correctChoices) hoặc Instructor (hiện correctChoices)
  http.get('/api/tests/:testId/questions', async ({ request }) => {
    const referer = request.headers.get('referer') || '';
    const isInstructor = referer.includes('/instructor/');

    // Generate some dummy questions
    const questions = [
      {
        id: 'q1',
        statement: 'React là thư viện của công ty nào?',
        questionType: 'multiple_choice',
        choices: ['Google', 'Meta (Facebook)', 'Microsoft', 'Twitter'],
        correctChoices: [1],
        isSingleChoice: true,
      },
      {
        id: 'q2',
        statement: 'Các hook cơ bản trong React là gì? (Chọn nhiều)',
        questionType: 'multiple_choice',
        choices: ['useState', 'useForm', 'useEffect', 'useMouse'],
        correctChoices: [0, 2],
        isSingleChoice: false,
      },
      {
        id: 'q3',
        statement: 'TypeScript có hỗ trợ interface không?',
        questionType: 'multiple_choice',
        choices: ['Có', 'Không'],
        correctChoices: [0],
        isSingleChoice: true,
      },
    ];

    if (isInstructor) {
      return HttpResponse.json(questions);
    }

    // Học viên: ẩn correctChoices
    const studentQuestions = questions.map((q) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { correctChoices, ...studentQ } = q;
      return studentQ;
    });
    return HttpResponse.json(studentQuestions);
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

  // Cập nhật thứ tự câu hỏi
  http.patch('/api/tests/:testId/questions/:questionId/order', async () => {
    return new HttpResponse(null, { status: 204 });
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

  // Lấy session active hiện tại
  http.get('/api/tests/:testId/sessions/active', async ({ params }) => {
    const { testId } = params;
    const userId = 'user-1'; // Mock user
    const sessions = getSessions();
    const active = sessions.find(
      (s: Record<string, unknown>) => s.testId === testId && s.userId === userId && !s.isDone,
    );
    if (!active) {
      return new HttpResponse(null, { status: 404, statusText: 'No active session found' });
    }
    const elapsed = Math.floor(Date.now() / 1000) - (active.startedAtTs as number);
    const timeLimit = 1800;
    const remaining = Math.max(0, timeLimit - elapsed);
    return HttpResponse.json({
      ...active,
      remainingTime: remaining,
    });
  }),

  // Lấy danh sách sessions của test
  http.get('/api/tests/:testId/sessions', async ({ params }) => {
    const { testId } = params;
    const sessions = getSessions();
    const testSessions = sessions.filter((s: Record<string, unknown>) => s.testId === testId);
    return HttpResponse.json(testSessions.map((s: Record<string, unknown>) => ({
      id: s.id,
      userId: s.userId,
      userDisplayName: 'Mock User',
      startedAt: s.startedAt,
      submittedAt: s.submittedAt,
      isDone: s.isDone,
    })));
  }),

  // Lấy lịch sử sessions của mình
  http.get('/api/tests/sessions/my', async () => {
    const userId = 'user-1';
    const sessions = getSessions();
    const mySessions = sessions.filter((s: Record<string, unknown>) => s.userId === userId && s.isDone);
    
    // Simulate pagination format
    return HttpResponse.json({
      content: mySessions.map((s: Record<string, unknown>) => ({
        id: s.id,
        testId: s.testId,
        lessonTitle: 'Mock Lesson',
        courseTitle: 'Mock Course',
        courseId: 'course-1',
        score: 4,
        correctCount: 3,
        totalQuestions: 3,
        submittedAt: s.submittedAt,
      })),
      pageable: { pageNumber: 0, pageSize: 20 },
      totalElements: mySessions.length,
      totalPages: 1,
      last: true,
    });
  }),

  // Lấy câu trả lời hiện tại của session (để restore khi f5)
  http.get('/api/sessions/:sessionId/answers', async ({ params }) => {
    const { sessionId } = params;
    const answers = getAnswers();
    return HttpResponse.json({ answers: answers[sessionId as string] || {} });
  }),

  // Lưu câu trả lời
  http.put('/api/sessions/:sessionId/answers', async ({ params, request }) => {
    const { sessionId } = params;
    const data = (await request.json()) as { questionId: string; selectedChoices: number[] };

    const answers = getAnswers();
    if (!answers[sessionId as string]) {
      answers[sessionId as string] = {};
    }
    answers[sessionId as string][data.questionId] = data.selectedChoices;
    saveAnswers(answers);

    return HttpResponse.json({ success: true });
  }),

  // Nộp bài
  http.post('/api/sessions/:sessionId/submit', async ({ params }) => {
    const { sessionId } = params;
    const sessions = getSessions();
    const session = sessions.find((s: Record<string, unknown>) => s.id === sessionId);

    if (!session) return new HttpResponse(null, { status: 404 });

    session.isDone = true;
    session.submittedAt = new Date().toISOString();
    saveSessions(sessions);

    return HttpResponse.json({ success: true, sessionId });
  }),

  // Lấy kết quả bài thi
  http.get('/api/sessions/:sessionId/result', async ({ params }) => {
    const { sessionId } = params;
    const sessions = getSessions();
    const session = sessions.find((s: Record<string, unknown>) => s.id === sessionId);

    if (!session) return new HttpResponse(null, { status: 404 });

    const answers = getAnswers();
    const sessionAnswers = answers[sessionId as string] || {};

    const questions = [
      {
        id: 'q1',
        statement: 'React là thư viện của công ty nào?',
        questionType: 'multiple_choice',
        choices: ['Google', 'Meta (Facebook)', 'Microsoft', 'Twitter'],
        correctChoices: [1],
        isSingleChoice: true,
        point: 1,
      },
      {
        id: 'q2',
        statement: 'Các hook cơ bản trong React là gì? (Chọn nhiều)',
        questionType: 'multiple_choice',
        choices: ['useState', 'useForm', 'useEffect', 'useMouse'],
        correctChoices: [0, 2],
        isSingleChoice: false,
        point: 2,
      },
      {
        id: 'q3',
        statement: 'TypeScript có hỗ trợ interface không?',
        questionType: 'multiple_choice',
        choices: ['Có', 'Không'],
        correctChoices: [0],
        isSingleChoice: true,
        point: 1,
      },
    ];

    let totalScore = 0;
    const maxScore = 4; // 1 + 2 + 1

    const resultAnswers = questions.map((q) => {
      const studentAnswer = sessionAnswers[q.id] || [];
      // Simple exact match logic for correct answers
      const isCorrect =
        studentAnswer.length === q.correctChoices.length &&
        studentAnswer.every((val: number) => q.correctChoices.includes(val));

      if (isCorrect) totalScore += q.point;

      return {
        questionId: q.id,
        statement: q.statement,
        choices: q.choices,
        correctChoices: q.correctChoices,
        studentAnswer: studentAnswer,
        isCorrect,
        point: isCorrect ? q.point : 0,
      };
    });

    const percent = Math.round((totalScore / maxScore) * 100);
    const duration = session.submittedAt
      ? Math.floor(
          (new Date(session.submittedAt).getTime() - new Date(session.startedAt).getTime()) / 1000,
        )
      : 0;

    return HttpResponse.json({
      sessionId,
      totalScore,
      maxScore,
      percent,
      duration,
      answers: resultAnswers,
    });
  }),
];
