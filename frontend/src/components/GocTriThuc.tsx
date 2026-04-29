import { cn } from '@/lib/utils';
import { BookOpen } from 'lucide-react';

export const GocTriThuc = ({ className, withLogo }: { className?: string; withLogo?: boolean }) => {
  return (
    <>
      {withLogo && <BookOpen />}
      <span
        className={cn(
          'bg-[linear-gradient(90deg,#ef4444,#f59e0b,#eab308,#22c55e,#3b82f6,#a855f7)] bg-clip-text text-transparent',
          className,
        )}
      >
        GocTriThuc
      </span>
    </>
  );
};
