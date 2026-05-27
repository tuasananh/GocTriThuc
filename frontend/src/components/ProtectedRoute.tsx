import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

/**
 * Route guard: chỉ cho user đã đăng nhập truy cập.
 * Nếu chưa đăng nhập → redirect về /login?redirect=current_path
 *
 * Dùng trong App.tsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 *
 * Có thể yêu cầu permission cụ thể (bitmask):
 *   <Route element={<ProtectedRoute requiredPermission={PERMISSION.MANAGE_OWN_COURSES} />}>
 *     <Route path="/instructor/*" element={<InstructorLayout />} />
 *   </Route>
 */
export function ProtectedRoute({ requiredPermission }: { requiredPermission?: bigint }) {
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
    const redirectUrl = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`${ROUTES.LOGIN}?redirect=${encodeURIComponent(redirectUrl)}`} replace />;
  }

  // Kiểm tra quyền (nếu yêu cầu)
  if (requiredPermission && (auth.user.permissions & requiredPermission) !== requiredPermission) {
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
