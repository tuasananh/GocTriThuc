import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { MainLayout } from '@/layouts/MainLayout';
import { LandingPage } from '@/pages';
import { LoginPage } from '@/pages/login';
// Dashboard component can be implemented later or replaced, keeping it for existing route validity
import { Dashboard } from '@/pages/dashboard';
import { GuestRoute } from '@/components/GuestRoute';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthProvider } from './providers/AuthProvider';
import { StudioCoursesPage } from '@/pages/studio/courses';
import { StudioCourseEditorPage } from '@/pages/studio/course';
import { Permissions } from '@/lib/permissions';

// Configure Axios globally to send session and CSRF cookies
axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
          </Route>
          <Route element={<GuestRoute />}>
            {/* Full-screen auth route */}
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected Dashboard Route (for future) */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Studio: Course Management (requires Manage Own Courses permission) */}
          <Route element={<ProtectedRoute requiredPermission={Permissions.MANAGE_OWN_COURSES} />}>
            <Route path="/studio/courses" element={<StudioCoursesPage />} />
            <Route path="/studio/course/:courseId" element={<StudioCourseEditorPage />} />
          </Route>

          {/* Dummy route for individual course details to demonstrate Auth Guard redirect */}
          <Route
            path="/courses/:courseId"
            element={
              <div className="p-20 text-center text-3xl font-bold bg-background min-h-screen text-foreground">
                Bạn đã đăng nhập thành công và truy cập vào chi tiết khoá học!
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
