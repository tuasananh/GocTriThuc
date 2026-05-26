import type { ReactNode } from 'react';

/**
 * Header chung cho mỗi section/trang.
 *
 * Dùng:
 *   <SectionHeader
 *     title="Ngân hàng câu hỏi"
 *     description="Tạo và quản lý câu hỏi trắc nghiệm"
 *     action={<Button><Plus size={16} /> Tạo câu hỏi</Button>}
 *   />
 */
export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-sm md:text-base">{description}</p>
        )}
      </div>
      {action && <div className="mt-3 sm:mt-0 shrink-0">{action}</div>}
    </div>
  );
}
