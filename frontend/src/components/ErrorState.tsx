import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Hiển thị khi có lỗi tải dữ liệu, kèm nút "Thử lại".
 *
 * Dùng:
 *   {error && <ErrorState message={error} onRetry={() => fetchData()} />}
 */
export function ErrorState({
  message = 'Đã xảy ra lỗi. Vui lòng thử lại.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-16 text-center">
      <div className="mb-4 rounded-full bg-destructive/10 p-4">
        <AlertTriangle size={32} className="text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">Có lỗi xảy ra</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          <RefreshCw size={16} className="mr-2" />
          Thử lại
        </Button>
      )}
    </div>
  );
}
