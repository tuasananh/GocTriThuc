import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { LandingPage } from '@/pages';
import { LoginPage } from '@/pages/login';
import { Dashboard } from '@/pages/dashboard';
import { CourseListPage } from '@/pages/courses';
import { CourseDetailPage } from '@/pages/course-detail';
import { ProfilePage } from '@/pages/profile';
import { LessonPage } from '@/pages/lessons';
import { CourseEditorPage } from './pages/instructor/course-editor';
import { LessonEditorPage } from './pages/instructor/lesson-editor';
import { TestTakePage } from '@/pages/test-take';
import { TestBuilderPage } from './pages/instructor/test-builder';
import { CommentThreadSinglePage } from '@/pages/comments';
import { GuestRoute } from '@/components/GuestRoute';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthProvider } from './providers/AuthProvider';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { lazy, Suspense } from 'react';
import { ROUTES } from '@/lib/routes';
import { PERMISSION } from '@/lib/permissions';

const EditorTestPage = lazy(() =>
  import('@/pages/editor-test').then((m) => ({ default: m.EditorTestPage })),
);

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider>
          <AuthProvider>
            <Routes>
              {/* ── Public (với MainLayout) ────────────────── */}
              <Route element={<MainLayout />}>
                <Route path={ROUTES.HOME} element={<LandingPage />} />
                <Route path={ROUTES.COURSE_DETAIL(':id')} element={<CourseDetailPage />} />
                <Route path={ROUTES.COURSES} element={<CourseListPage />} />
              </Route>

              {/* ── Guest Only (redirect nếu đã đăng nhập) ── */}
              <Route element={<GuestRoute />}>
                <Route path={ROUTES.LOGIN} element={<LoginPage />} />
              </Route>

              {/* ── Protected (cần đăng nhập) ─────────────── */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                  <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
                  <Route path={ROUTES.LESSON(':courseId', ':lessonId')} element={<LessonPage />} />
                  <Route path={ROUTES.TEST_TAKE(':testId')} element={<TestTakePage />} />
                  <Route path="/comments/thread/:id" element={<CommentThreadSinglePage />} />
                  {/* <Route path={ROUTES.CLASSROOM(':id')} element={<ClassroomPage />} /> */}
                </Route>
              </Route>

              {/* ── Instructor (cần quyền quản lý khóa học) ────────── */}
              <Route
                element={<ProtectedRoute requiredPermission={PERMISSION.MANAGE_OWN_COURSES} />}
              >
                <Route element={<MainLayout />}>
                  {/* Thêm các trang instructor ở đây:
                    <Route path={ROUTES.INSTRUCTOR_DASHBOARD} element={<InstructorDashboard />} />
                    <Route path={ROUTES.QUESTION_BANK} element={<QuestionBankPage />} />
                  */}
                  <Route
                    path={ROUTES.INSTRUCTOR_COURSE_EDITOR(':id')}
                    element={<CourseEditorPage />}
                  />
                  <Route
                    path={ROUTES.INSTRUCTOR_LESSON_EDITOR(':lessonId')}
                    element={<LessonEditorPage />}
                  />
                  <Route
                    path={ROUTES.INSTRUCTOR_TEST_BUILDER(':lessonId')}
                    element={<TestBuilderPage />}
                  />
                </Route>
              </Route>

              {/* ── Admin (cần quyền admin) ────────────────── */}
              <Route element={<ProtectedRoute requiredPermission={PERMISSION.ADMIN} />}>
                <Route element={<MainLayout />}>
                  {/* Thêm các trang admin ở đây:
                    <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
                    <Route path={ROUTES.ADMIN_USERS} element={<AdminUsersPage />} />
                */}
                </Route>
              </Route>

              {/* ── Dev Tools ─────────────────────────────── */}
              <Route
                path="/editor-test"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <EditorTestPage />
                  </Suspense>
                }
              />
            </Routes>

            <Toaster position="bottom-right" richColors closeButton />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
