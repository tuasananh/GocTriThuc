import { Badge } from '@/components/ui/badge';

const roleConfig: Record<string, { label: string; className: string }> = {
  admin: {
    label: 'Admin',
    className:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
  },
  teacher: {
    label: 'Giảng viên',
    className:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  student: {
    label: 'Học viên',
    className:
      'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
  },
};

/**
 * Badge hiển thị role với màu sắc tương ứng.
 *
 * Dùng:
 *   <RoleBadge role="admin" />
 *   <RoleBadge role="teacher" />
 *   <RoleBadge role="student" />
 */
export function RoleBadge({ role }: { role: string }) {
  const config = roleConfig[role.toLowerCase()] ?? {
    label: role,
    className: 'bg-muted text-muted-foreground',
  };

  return (
    <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
}
