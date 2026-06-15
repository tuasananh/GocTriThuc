// ============================================================
// Question & Test DTOs
// ============================================================

export interface TestDto {
  id: string;
  statement: string;
  timeLimit: number;
}

/** Câu hỏi nhìn từ phía Instructor (bao gồm đáp án đúng) */
export interface QuestionDto {
  id: string;
  statement: string;
  questionType: 'multiple_choice';
  choices: string[];
  correctChoices: number[]; // chỉ instructor thấy
  isSingleChoice: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Câu hỏi nhìn từ phía Student (KHÔNG có đáp án đúng) */
export interface QuestionStudentDto {
  id: string;
  statement: string;
  questionType: 'multiple_choice';
  choices: string[];
  isSingleChoice: boolean;
}

/** Request body cho POST /api/questions */
export interface CreateQuestionRequest {
  statement: string;
  choices: string[];
  correctChoices: number[];
  isSingleChoice: boolean;
}

/** Câu hỏi đã được link vào test (có điểm + thứ tự) */
export interface TestQuestionDto extends QuestionDto {
  point: number;
  order: number;
}

// ============================================================
// Test Session DTOs
// ============================================================

export interface TestSessionDto {
  id: string;
  userId: string;
  testId: string;
  startedAt: string;
  submittedAt: string | null; // null khi đang làm bài
  isDone?: boolean;
  remainingTime: number; // seconds — tính từ server
  createdAt: string;
}

export interface TestSessionAnswerDto {
  questionId: string;
  questionAnswer: number[] | null; // mảng index lựa chọn, ví dụ [0, 2]
}

export interface QuestionResultItem {
  questionId: string;
  statement: string;
  choices: string[];
  correctChoices: number[];
  studentAnswer: number[] | null;
  isCorrect: boolean;
  point: number;
}

export interface TestResultDto {
  sessionId: string;
  testId: string;
  score: number; // percentage score (0-100)
  correctCount: number;
  totalQuestions: number;
  startedAt: string;
  submittedAt: string | null;
  timeTakenSeconds: number;
  questions: QuestionResultItem[];
}

export interface MyTestSessionDto {
  sessionId: string;
  testId: string;
  testTitle: string;
  courseTitle: string;
  courseId: number;
  score: number;
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
}

export interface TestSessionSummaryDto {
  sessionId: string;
  userId: string;
  displayName: string;
  startedAt: string;
  submittedAt: string | null;
  isDone: boolean;
}
