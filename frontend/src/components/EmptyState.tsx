import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

/**
 * Hiển thị khi không có dữ liệu (danh sách rỗng).
 *
 * Dùng:
 *   {courses.length === 0 && (
 *     <EmptyState
 *       icon={BookOpen}
 *       title="Chưa có khóa học nào"
 *       description="Hãy tạo khóa học đầu tiên của bạn"
 *       action={<Button>Tạo khóa học</Button>}
 *     />
 *   )}
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icon size={32} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
