import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { PageResponse, AdminUserResponse } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { SkeletonCard } from '@/components/SkeletonCard';
import { ErrorState } from '@/components/ErrorState';
import { RoleBadge } from '@/components/RoleBadge';
import { EmptyState } from '@/components/EmptyState';
import { Users } from 'lucide-react';

export const UserRoleTable = () => {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PageResponse<AdminUserResponse>>('/api/admin/users');
      setUsers(res.data.content);
    } catch {
      setError('Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
      toast.success('Cập nhật quyền thành công.');
      // Update UI optimistically or refetch
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            const newRoles = ['student'];
            if (newRole === 'teacher' || newRole === 'admin') newRoles.push('teacher');
            if (newRole === 'admin') newRoles.push('admin');
            return { ...u, roles: newRoles };
          }
          return u;
        }),
      );
    } catch {
      toast.error('Lỗi khi cập nhật quyền.');
    }
  };

  const getHighestRole = (roles: string[]) => {
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('teacher')) return 'teacher';
    return 'student';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchUsers} />;
  }

  if (users.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Không có người dùng"
        description="Hiện tại không có người dùng nào trong hệ thống."
      />
    );
  }

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Người dùng</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Quyền hiện tại</TableHead>
            <TableHead className="w-[180px]">Thay đổi phân quyền</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl ?? undefined} />
                    <AvatarFallback>
                      {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.displayName || user.username}</span>
                    <span className="text-xs text-muted-foreground">@{user.username}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {user.roles.map((r) => (
                    <RoleBadge key={r} role={r} />
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Select
                  value={getHighestRole(user.roles)}
                  onValueChange={(value) => handleRoleChange(user.id, value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn quyền" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Học viên</SelectItem>
                    <SelectItem value="teacher">Giảng viên</SelectItem>
                    <SelectItem value="admin">Quản trị viên</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
