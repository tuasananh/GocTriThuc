import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';

interface ProtectedRouteProps {
  /** The bitwise permission required to access this route. */
  requiredPermission?: bigint;
  /** Redirect path if unauthorized. Defaults to '/login'. */
  redirectTo?: string;
  children?: React.ReactNode;
}

export function ProtectedRoute({
  requiredPermission,
  redirectTo = '/login',
  children,
}: ProtectedRouteProps) {
  const auth = useAuth();

  // Still loading auth state
  if (auth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!auth.isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check specific permission
  if (requiredPermission && !hasPermission(auth.user.permissions, requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">403</h1>
          <p className="text-muted-foreground text-lg">Bạn không có quyền truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
