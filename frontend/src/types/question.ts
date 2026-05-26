// ============================================================
// Question & Test DTOs
// ============================================================

/** Câu hỏi nhìn từ phía Instructor (bao gồm đáp án đúng) */
export interface QuestionDto {
  id: number;
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
  id: number;
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
  id: number;
  userId: number;
  testId: number;
  startedAt: string;
  isDone: boolean;
  remainingTime: number; // seconds — tính từ server
  createdAt: string;
}

export interface TestSessionAnswerDto {
  questionId: number;
  questionAnswer: string | null;
}

export interface TestResultDto {
  sessionId: number;
  totalScore: number;
  maxScore: number;
  percent: number;
  duration: number; // seconds
  answers: {
    questionId: number;
    statement: string;
    choices: string[];
    correctChoices: number[];
    studentAnswer: string | null;
    isCorrect: boolean;
    point: number;
  }[];
}
