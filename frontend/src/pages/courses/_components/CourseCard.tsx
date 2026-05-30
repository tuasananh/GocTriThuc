import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ROUTES } from '@/lib/routes';
import type { CourseDto } from '@/types';

export function CourseCard({ course }: { course: CourseDto }) {
  const visibilityBadge = {
    Public: { label: 'Công khai', variant: 'secondary' as const },
    Restricted: { label: 'Giới hạn', variant: 'outline' as const },
    Private: { label: 'Riêng tư', variant: 'destructive' as const },
  }[course.visibility];

  return (
    <Link to={ROUTES.COURSE_DETAIL(course.id)} className="group block">
      <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
        {/* Thumbnail */}
        <div className="aspect-video overflow-hidden bg-muted">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen size={32} className="text-muted-foreground" />
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <Badge variant={visibilityBadge.variant}>{visibilityBadge.label}</Badge>
            {!course.isPublished && (
              <Badge variant="outline" className="text-amber-600">
                Bản nháp
              </Badge>
            )}
          </div>

          <h3 className="mb-2 line-clamp-2 font-semibold text-foreground">{course.title}</h3>

          <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>

          <div className="mt-3 flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={course.author.avatarUrl ?? undefined}
                alt={course.author.displayName || course.author.username}
              />
              <AvatarFallback className="text-xs">
                {(course.author.displayName || course.author.username || 'U')
                  .charAt(0)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{course.author.displayName}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
