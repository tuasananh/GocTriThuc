import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { MainLayout } from '@/layouts/MainLayout';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
// Dashboard component can be implemented later or replaced, keeping it for existing route validity
import { Dashboard } from '@/components/Dashboard';
import { GuestRoute } from '@/components/GuestRoute';

// Configure Axios globally to send session and CSRF cookies
axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

// Setup Mock Service Worker (Note: this is also loaded in main.tsx before App renders)
// So anything within App can freely use axios.

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
          </Route>
          {/* Full-screen auth route */}
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Protected Dashboard Route (for future) */}
        <Route path="/dashboard" element={<Dashboard />} />

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
    </BrowserRouter>
  );
}

export default App;
