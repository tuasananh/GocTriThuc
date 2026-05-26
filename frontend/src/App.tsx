import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { LandingPage } from '@/pages';
import { LoginPage } from '@/pages/login';
import { Dashboard } from '@/pages/dashboard';
import { GuestRoute } from '@/components/GuestRoute';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthProvider } from './providers/AuthProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { lazy, Suspense } from 'react';

const EditorTestPage = lazy(() =>
  import('@/pages/editor-test').then((m) => ({ default: m.EditorTestPage })),
);

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="goctrithuc-theme">
        <TooltipProvider>
          <AuthProvider>
            <Routes>
              {/* ── Public (với MainLayout) ────────────────── */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<LandingPage />} />
                {/* Thêm các trang public khác ở đây:
                  <Route path="/courses" element={<CourseListPage />} />
                  <Route path="/courses/:id" element={<CourseDetailPage />} />
              */}
              </Route>

              {/* ── Guest Only (redirect nếu đã đăng nhập) ── */}
              <Route element={<GuestRoute />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>

              {/* ── Protected (cần đăng nhập) ─────────────── */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  {/* Thêm các trang cần auth ở đây:
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/courses/:id/classroom" element={<ClassroomPage />} />
                */}
                </Route>
              </Route>

              {/* ── Instructor (cần role teacher) ────────── */}
              <Route element={<ProtectedRoute requiredRole="teacher" />}>
                <Route element={<MainLayout />}>
                  {/* Thêm các trang instructor ở đây:
                    <Route path="/instructor" element={<InstructorDashboard />} />
                    <Route path="/instructor/courses/:id" element={<CourseEditorPage />} />
                    <Route path="/instructor/questions" element={<QuestionBankPage />} />
                */}
                </Route>
              </Route>

              {/* ── Admin (cần role admin) ────────────────── */}
              <Route element={<ProtectedRoute requiredRole="admin" />}>
                <Route element={<MainLayout />}>
                  {/* Thêm các trang admin ở đây:
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
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

            {/* Toast notifications — hiển thị ở góc dưới phải */}
            <Toaster position="bottom-right" richColors closeButton />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
