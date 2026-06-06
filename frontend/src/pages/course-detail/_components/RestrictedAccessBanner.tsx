import { ShieldAlert, Clock } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { AccessStatus } from '@/types';

interface RestrictedAccessBannerProps {
  visibility: string;
  accessStatus: AccessStatus;
  isAuthor?: boolean;
  isAdmin?: boolean;
}

export function RestrictedAccessBanner({
  visibility,
  accessStatus,
  isAuthor,
  isAdmin,
}: RestrictedAccessBannerProps) {
  if (isAuthor || isAdmin) {
    return null;
  }

  if (visibility !== 'restricted') {
    return null;
  }

  if (accessStatus === 'enrolled') {
    return null;
  }

  return (
    <div className="mt-8 mb-4">
      {accessStatus === 'requested' ? (
        <Alert className="shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-400 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-500">
          <Clock className="h-4 w-4" />
          <AlertTitle className="font-semibold">Yêu cầu đang chờ xử lý</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400/80">
            Bạn đã gửi yêu cầu tham gia khóa học này. Vui lòng chờ giảng viên phê duyệt.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 border-blue-500/50 bg-blue-500/10 text-blue-800 dark:text-blue-400 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-500">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle className="font-semibold">Khóa học giới hạn</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-400/80">
            Đây là khóa học giới hạn. Bạn cần gửi yêu cầu và được giảng viên phê duyệt để có thể xem
            nội dung.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
