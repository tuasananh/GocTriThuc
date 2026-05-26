/**
 * Route constants — đường dẫn tập trung, không hardcode path.
 *
 * Dùng:
 *   import { ROUTES } from '@/lib/routes';
 *   <Link to={ROUTES.COURSE_DETAIL(course.id)}>...</Link>
 *   navigate(ROUTES.COURSES);
 */
export const ROUTES = {
  // ── Public ─────────────────────────────────────
  HOME: '/',
  LOGIN: '/login',
  COURSES: '/courses',
  COURSE_DETAIL: (id: number | string) => `/courses/${id}`,

  // ── Classroom (Enrolled student) ───────────────
  CLASSROOM: (courseId: number | string) => `/courses/${courseId}/classroom`,
  LESSON: (courseId: number | string, lessonId: number | string) =>
    `/courses/${courseId}/lessons/${lessonId}`,
  TEST_TAKE: (testId: number | string) => `/tests/${testId}/take`,
  TEST_RESULT: (sessionId: number | string) => `/tests/sessions/${sessionId}/result`,

  // ── Student ────────────────────────────────────
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',

  // ── Instructor ─────────────────────────────────
  INSTRUCTOR_DASHBOARD: '/instructor',
  INSTRUCTOR_COURSE_EDITOR: (id: number | string) => `/instructor/courses/${id}`,
  INSTRUCTOR_LESSON_EDITOR: (lessonId: number | string) =>
    `/instructor/lessons/${lessonId}/edit`,
  INSTRUCTOR_TEST_BUILDER: (lessonId: number | string) =>
    `/instructor/lessons/${lessonId}/test`,
  QUESTION_BANK: '/instructor/questions',

  // ── Admin ──────────────────────────────────────
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',

  // ── Comments ───────────────────────────────────
  COMMENT_THREAD: (commentId: number | string) => `/comments/thread/${commentId}`,
} as const;
