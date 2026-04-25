import { Outlet, Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/10 font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight">Góc Tri Thức</span>
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
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
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/login">Đăng nhập</Link>
            </Button>
            <Button asChild className="rounded-full px-6">
              <Link to="/login">Bắt đầu ngay</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="border-t bg-muted/40 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-80">
            <BookOpen className="h-5 w-5" />
            <span className="font-semibold">Góc Tri Thức</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; 2026 Góc Tri Thức. Tôn trọng bản quyền.
          </p>
        </div>
      </footer>
    </div>
  );
}
