import { useState, useEffect } from 'react';
import { PageShell } from '@/components/PageShell';
import { SectionHeader } from '@/components/SectionHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { AvatarUpload } from './_components/AvatarUpload';

export function ProfilePage() {
  const auth = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string; username?: string }>({});

  // Sync state when auth user changes
  useEffect(() => {
    if (auth?.isAuthenticated) {
      setDisplayName(auth.user.displayName || '');
      setUsername(auth.user.username || '');
    }
  }, [auth]);

  if (!auth?.isAuthenticated) {
    return null; // ProtectedRoute will handle redirect
  }

  // After the check, we can alias user for convenience
  const user = auth.user;

  const validate = () => {
    const newErrors: { displayName?: string; username?: string } = {};
    if (displayName.length < 2 || displayName.length > 100) {
      newErrors.displayName = 'Tên hiển thị phải từ 2 đến 100 ký tự.';
    }
    if (username.length < 3 || username.length > 30) {
      newErrors.username = 'Tên người dùng phải từ 3 đến 30 ký tự.';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Tên người dùng chỉ được chứa chữ cái, số và dấu gạch dưới.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      await api.patch('/api/users/me', {
        displayName,
        username,
      });
      toast.success('Cập nhật hồ sơ thành công');
      await auth.refreshUser();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrors({ username: 'Tên người dùng đã tồn tại.' });
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật hồ sơ. Vui lòng thử lại.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell>
      <SectionHeader
        title="Hồ sơ cá nhân"
        description="Quản lý thông tin và ảnh đại diện của bạn"
      />

      <div className="max-w-2xl mt-6 space-y-8">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Ảnh đại diện</h3>
          <AvatarUpload user={user} />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Thông tin cơ bản</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-muted text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">Email không thể thay đổi.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Tên hiển thị</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (errors.displayName) setErrors({ ...errors, displayName: undefined });
                }}
              />
              {errors.displayName && (
                <p className="text-sm text-destructive">{errors.displayName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Tên người dùng (Username)</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors({ ...errors, username: undefined });
                }}
              />
              {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
            </div>

            <Button onClick={handleSave} disabled={saving} className="mt-4">
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
