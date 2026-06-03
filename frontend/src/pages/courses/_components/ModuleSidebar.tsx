import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Circle, 
  PlayCircle, 
  FileText, 
  HelpCircle, 
  ChevronDown, 
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { ROUTES } from '@/lib/routes';
import type { ModuleDto, LessonDto } from '@/types';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ModuleSidebarProps {
  courseId: string;
  modules: ModuleDto[];
  activeLessonId?: string;
  onLessonSelect?: (lessonId: string) => void;
}

export function ModuleSidebar({
  courseId,
  modules,
  activeLessonId,
  onLessonSelect,
}: ModuleSidebarProps) {
  // Expand modules by default
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (modules && modules.length > 0) {
      const initial: Record<string, boolean> = {};
      modules.forEach((m) => {
        initial[m.id] = true;
      });
      setExpandedModules(initial);
    }
  }, [modules]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  // Calculate learning progress
  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  const completedLessons = modules.reduce(
    (acc, m) => acc + (m.lessons?.filter((l) => l.isCompleted).length || 0),
    0
  );
  const completionPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const getLessonIcon = (type: LessonDto['lessonType']) => {
    switch (type) {
      case 'video':
        return <PlayCircle className="w-4 h-4 text-blue-500" />;
      case 'test':
        return <HelpCircle className="w-4 h-4 text-purple-500" />;
      case 'blog':
      default:
        return <FileText className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <aside className="w-full md:w-80 flex flex-col border-r border-border/50 bg-card/60 backdrop-blur-md h-full select-none">
      {/* Header & Progress */}
      <div className="p-4 border-b border-border/50 bg-card/45">
        <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-primary" />
          Nội dung khóa học
        </h2>
        
        {totalLessons > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>Đã hoàn thành {completedLessons}/{totalLessons} bài học</span>
              <span>{completionPercent}%</span>
            </div>
            <Progress value={completionPercent} className="h-1.5 bg-muted" />
          </div>
        )}
      </div>

      {/* Modules List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {modules.map((mod, index) => {
          const isExpanded = !!expandedModules[mod.id];
          const completedInModule = mod.lessons?.filter((l) => l.isCompleted).length || 0;
          const totalInModule = mod.lessons?.length || 0;

          return (
            <div key={mod.id} className="rounded-lg overflow-hidden border border-border/10 bg-background/30">
              {/* Module Header */}
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-start gap-2 p-3 text-left hover:bg-muted/30 transition-all duration-200"
              >
                <span className="mt-0.5">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform duration-200" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground leading-snug line-clamp-2">
                    Chương {index + 1}: {mod.title}
                  </h3>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {completedInModule}/{totalInModule} bài học
                  </span>
                </div>
              </button>

              {/* Lessons List in Module */}
              {isExpanded && mod.lessons && (
                <div className="border-t border-border/10 divide-y divide-border/5 bg-card/20">
                  {mod.lessons.map((lesson) => {
                    const isActive = activeLessonId === lesson.id;
                    const LessonLinkOrButton = onLessonSelect ? 'button' : Link;
                    const targetProps = onLessonSelect 
                      ? { onClick: () => onLessonSelect(lesson.id) }
                      : { to: ROUTES.LESSON(courseId, lesson.id) };

                    return (
                      <LessonLinkOrButton
                        key={lesson.id}
                        {...(targetProps as any)}
                        className={cn(
                          "w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-all duration-200 hover:bg-muted/50",
                          isActive && "bg-primary/5 text-primary font-medium border-l-2 border-primary pl-3.5"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Checkmark for Completion Status */}
                          <span className="flex-shrink-0">
                            {lesson.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/10 transition-transform duration-200 scale-105" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                            )}
                          </span>

                          {/* Lesson Type Icon */}
                          <span className="flex-shrink-0">
                            {getLessonIcon(lesson.lessonType)}
                          </span>

                          {/* Lesson Title */}
                          <span className={cn(
                            "truncate text-muted-foreground leading-snug",
                            isActive && "text-primary",
                            lesson.isCompleted && "text-foreground/80 line-through decoration-muted-foreground/30"
                          )}>
                            {lesson.title}
                          </span>
                        </div>
                      </LessonLinkOrButton>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
