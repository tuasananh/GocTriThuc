import type { ReactNode } from 'react';

/**
 * Wrapper chung cho tất cả các trang.
 * Đảm bảo padding, max-width, spacing nhất quán trên toàn app.
 *
 * Dùng:
 *   <PageShell>
 *     <SectionHeader title="Khóa học" />
 *     <CourseGrid />
 *   </PageShell>
 */
export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`container mx-auto px-4 py-8 md:px-8 md:py-12 ${className ?? ''}`}>
      {children}
    </div>
  );
}
