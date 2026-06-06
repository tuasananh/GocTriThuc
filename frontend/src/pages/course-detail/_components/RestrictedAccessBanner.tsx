import { ShieldAlert, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
        <Card className="border-amber-500/50 bg-amber-500/10 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
          <CardContent className="flex items-center gap-4 p-4">
            <Clock className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-700 dark:text-amber-400">
                Yêu cầu đang chờ xử lý
              </h3>
              <p className="text-sm text-amber-600 dark:text-amber-500/80">
                Bạn đã gửi yêu cầu tham gia khóa học này. Vui lòng chờ giảng viên phê duyệt.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-blue-500/50 bg-blue-500/10 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
          <CardContent className="flex items-center gap-4 p-4">
            <ShieldAlert className="w-6 h-6 text-blue-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-700 dark:text-blue-400">Khóa học giới hạn</h3>
              <p className="text-sm text-blue-600 dark:text-blue-500/80">
                Đây là khóa học giới hạn. Bạn cần gửi yêu cầu và được giảng viên phê duyệt để có thể
                xem nội dung.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
