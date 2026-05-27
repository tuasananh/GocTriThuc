// ============================================================
// Question & Test DTOs
// ============================================================

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
  isDone: boolean;
  remainingTime: number; // seconds — tính từ server
  createdAt: string;
}

export interface TestSessionAnswerDto {
  questionId: string;
  questionAnswer: number[] | null; // mảng index lựa chọn, ví dụ [0, 2]
}

export interface TestResultDto {
  sessionId: string;
  totalScore: number;
  maxScore: number;
  percent: number;
  duration: number; // seconds
  answers: {
    questionId: string;
    statement: string;
    choices: string[];
    correctChoices: number[];
    studentAnswer: number[] | null;
    isCorrect: boolean;
    point: number;
  }[];
}
