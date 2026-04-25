import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

export function GuestRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await axios.get<boolean>('/api/auth/is_authenticated');
        setIsAuthenticated(response.data);
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, [location.pathname]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
