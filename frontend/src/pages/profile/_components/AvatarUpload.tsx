import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Camera, Loader2 } from 'lucide-react';
import { fileServeUrl, type CurrentUser, type FileDto } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface AvatarUploadProps {
  user: CurrentUser;
}

export function AvatarUpload({ user }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const auth = useAuth();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh hợp lệ.');
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<FileDto>(
        '/api/files/upload',
        form,
      );

      // Register file ID in user avatar profile
      const serveUrl = fileServeUrl(data.id);
      await api.patch('/api/users/me', { avatarUrl: serveUrl });

      toast.success('Cập nhật ảnh đại diện thành công');

      // Refresh global user state
      if (auth?.isAuthenticated) {
        await auth.refreshUser();
      }
    } catch {
      toast.error('Có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-md">
          <AvatarImage src={user.avatarUrl || ''} alt={user.displayName || user.username} />
          <AvatarFallback className="text-2xl sm:text-4xl">
            {user.displayName?.[0]?.toUpperCase() || user.username[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Camera className="w-6 h-6" />
          )}
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFile}
        accept="image/*"
        className="hidden"
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? 'Đang tải lên...' : 'Đổi ảnh đại diện'}
      </Button>
    </div>
  );
}
