import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * Route guard: chỉ cho user đã đăng nhập truy cập.
 * Nếu chưa đăng nhập → redirect về /login?redirect=current_path
 *
 * Dùng trong App.tsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 *
 * Có thể yêu cầu role cụ thể:
 *   <Route element={<ProtectedRoute requiredRole="teacher" />}>
 *     <Route path="/instructor/*" element={<InstructorLayout />} />
 *   </Route>
 */
export function ProtectedRoute({ requiredRole }: { requiredRole?: string }) {
  const auth = useAuth();
  const location = useLocation();

  // Đang load auth state
  if (auth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập → redirect
  if (!auth.isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Kiểm tra role (nếu yêu cầu)
  if (requiredRole && !auth.user.roles.includes(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">403 — Không có quyền</h1>
          <p className="text-muted-foreground">Bạn không có quyền truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
