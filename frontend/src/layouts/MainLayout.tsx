import { Outlet, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import type { CurrentUser } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GocTriThuc } from '@/components/GocTriThuc';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ROUTES } from '@/lib/routes';

import { useIsAdmin, useIsInstructor } from '@/lib/permissions';

const UserButtonDropdown = ({
  user,
  logout,
}: {
  user: CurrentUser;
  logout: () => Promise<void>;
}) => {
  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="px-2 py-5">
          {user.displayName || user.username}
          <Avatar>
            <AvatarImage
              src={user.avatarUrl || undefined}
              alt={user.displayName || user.username}
            />
            <AvatarFallback>
              {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      {/* Dropdown content can be added here in the future */}
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>@{user.username}</DropdownMenuLabel>
          <DropdownMenuItem>
            <Link to={ROUTES.PROFILE} className="w-full">
              Hồ sơ cá nhân
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link to={ROUTES.DASHBOARD} className="w-full">
              Bảng điều khiển học viên
            </Link>
          </DropdownMenuItem>
          {isInstructor && (
            <DropdownMenuItem>
              <Link to={ROUTES.INSTRUCTOR_DASHBOARD} className="w-full">
                Bảng điều khiển giảng viên
              </Link>
            </DropdownMenuItem>
          )}
          {isAdmin && (
            <DropdownMenuItem>
              <Link to={ROUTES.ADMIN_DASHBOARD} className="w-full">
                Bảng điều khiển admin
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onSelect={logout}>
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function MainLayout() {
  const auth = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/10 font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <GocTriThuc withLogo className="text-lg font-semibold" />
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            <Link to={ROUTES.COURSES} className="hover:text-foreground transition-colors">
              Khóa học
            </Link>
            <Link to="#" className="hover:text-foreground transition-colors">
              Giới thiệu
            </Link>
            <Link to="#" className="hover:text-foreground transition-colors">
              Trợ giúp
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {auth && auth.isAuthenticated ? (
              <UserButtonDropdown user={auth.user} logout={auth.logout} />
            ) : (
              <Button asChild className="rounded-full px-6">
                <Link to={ROUTES.LOGIN}>Bắt đầu ngay</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="border-t bg-muted/40 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-80">
            <GocTriThuc withLogo className="text-lg font-semibold" />
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; 2026 GocTriThuc. Tôn trọng bản quyền.
          </p>
        </div>
      </footer>
    </div>
  );
}
