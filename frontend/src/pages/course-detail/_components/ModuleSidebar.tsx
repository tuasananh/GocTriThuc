import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { ROUTES } from '@/lib/routes';
import type { ModuleDto, LessonDto } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import {
  Video,
  FileText,
  CheckSquare,
  CheckCircle2,
  Circle,
  BookOpen,
  ChevronRight,
} from 'lucide-react';

interface ModuleSidebarProps {
  courseId: string;
  /** Cho phép hiển thị — chỉ render khi enrolled/author/admin */
  visible: boolean;
}

async function loadModules(courseId: string): Promise<ModuleDto[]> {
  const res = await api.get<ModuleDto[]>(`/api/courses/${courseId}/modules`);
  const sorted = res.data.sort((a, b) => a.order - b.order);
  sorted.forEach((m) => m.lessons.sort((a, b) => a.order - b.order));
  return sorted;
}

/**
 * Accordion hiển thị danh sách modules/lessons cho trang Course Detail.
 * Chỉ hiển thị khi user enrolled, là tác giả, hoặc admin.
 */
export function ModuleSidebar({ courseId, visible }: ModuleSidebarProps) {
  const navigate = useNavigate();
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchCountRef = useRef(0);

  const fetchModules = useCallback(() => {
    const count = ++fetchCountRef.current;
    setLoading(true);
    setError(null);
    loadModules(courseId).then(
      (data) => {
        if (count === fetchCountRef.current) {
          setModules(data);
          setLoading(false);
        }
      },
      () => {
        if (count === fetchCountRef.current) {
          setError('Không thể tải nội dung khóa học.');
          setLoading(false);
        }
      },
    );
  }, [courseId]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      fetchModules();
    }, 0);
    return () => clearTimeout(t);
  }, [visible, fetchModules]);

  if (!visible) return null;

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <section className="mt-12" aria-label="Nội dung khóa học">
        <SidebarHeading />
        <div className="space-y-3 mt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <div className="space-y-2 pl-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ── Error state ────────────────────────────────────────────
  if (error) {
    return (
      <section className="mt-12" aria-label="Nội dung khóa học">
        <SidebarHeading />
        <div className="mt-6">
          <ErrorState message={error} onRetry={fetchModules} />
        </div>
      </section>
    );
  }

  // ── Empty state ────────────────────────────────────────────
  if (modules.length === 0) {
    return (
      <section className="mt-12" aria-label="Nội dung khóa học">
        <SidebarHeading />
        <div className="mt-6">
          <EmptyState
            icon={BookOpen}
            title="Chưa có nội dung"
            description="Khóa học này chưa có bài học nào. Giảng viên đang chuẩn bị nội dung."
          />
        </div>
      </section>
    );
  }

  // ── Data state ─────────────────────────────────────────────
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.completed).length,
    0,
  );

  return (
    <section className="mt-12" aria-label="Nội dung khóa học">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <SidebarHeading />
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            {modules.length} học phần • {totalLessons} bài học
          </span>
          {completedLessons > 0 && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {completedLessons}/{totalLessons}
            </Badge>
          )}
        </div>
      </div>

      <Accordion type="multiple" defaultValue={modules.map((m) => m.id)} className="space-y-3">
        {modules.map((module, moduleIndex) => (
          <AccordionItem
            key={module.id}
            value={module.id}
            className="border bg-card rounded-lg px-4 shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3 text-left">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {moduleIndex + 1}
                </span>
                <div className="min-w-0">
                  <span className="font-semibold text-base text-foreground line-clamp-1">
                    {module.title}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {module.lessons.length} bài học
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              {module.lessons.length === 0 ? (
                <p className="text-sm text-muted-foreground italic pl-10">
                  Chưa có bài học trong học phần này.
                </p>
              ) : (
                <div className="space-y-1">
                  {module.lessons.map((lesson) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      onClick={() => {
                        navigate(ROUTES.LESSON(courseId, lesson.id));
                      }}
                    />
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function SidebarHeading() {
  return <h2 className="text-2xl font-bold tracking-tight text-foreground">Nội dung khóa học</h2>;
}

const lessonTypeConfig = {
  video: { icon: Video, label: 'Video', color: 'text-blue-500' },
  blog: { icon: FileText, label: 'Bài viết', color: 'text-emerald-500' },
  test: { icon: CheckSquare, label: 'Bài kiểm tra', color: 'text-amber-500' },
} as const;

function LessonRow({ lesson, onClick }: { lesson: LessonDto; onClick: () => void }) {
  const config = lessonTypeConfig[lesson.type] || lessonTypeConfig.blog;
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-left transition-all duration-200 hover:bg-muted/80 group cursor-pointer"
      aria-label={`${lesson.title} — ${config.label}`}
    >
      {/* Completion indicator */}
      <span className="shrink-0">
        {lesson.completed ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : (
          <Circle className="w-4 h-4 text-muted-foreground/40" />
        )}
      </span>

      {/* Lesson type icon */}
      <Icon className={`w-4 h-4 shrink-0 ${config.color}`} />

      {/* Title */}
      <span
        className={`flex-1 text-sm font-medium line-clamp-1 ${
          lesson.completed
            ? 'text-muted-foreground line-through decoration-muted-foreground/40'
            : 'text-foreground'
        }`}
      >
        {lesson.title}
      </span>

      {/* Type badge (mobile-hidden) */}
      <span className="hidden sm:inline-flex text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
        {config.label}
      </span>

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
    </button>
  );
}
