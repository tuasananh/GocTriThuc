import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Camera, Loader2, UploadCloud } from 'lucide-react';
import { fileServeUrl, type CurrentUser, type FileDto } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface AvatarUploadProps {
  user: CurrentUser;
}

export function AvatarUpload({ user }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const auth = useAuth();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh hợp lệ.');
      return;
    }

    // Preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setUploading(true);
    setProgress(0);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<FileDto>('/api/files/upload', form, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        },
      });

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
      setPreviewUrl(null); // Revert preview on error
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        className={`relative group rounded-full transition-colors ${dragActive ? 'ring-4 ring-primary/50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-md">
          <AvatarImage
            src={previewUrl || user.avatarUrl || ''}
            alt={user.displayName || user.username}
          />
          <AvatarFallback className="text-2xl sm:text-4xl">
            {user.displayName?.[0]?.toUpperCase() || user.username[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-full transition-opacity disabled:opacity-100 ${uploading || dragActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin mb-1" />
              <span className="text-xs font-semibold">{progress}%</span>
            </>
          ) : dragActive ? (
            <UploadCloud className="w-8 h-8 text-primary animate-bounce" />
          ) : (
            <Camera className="w-6 h-6" />
          )}
        </button>
      </div>

      {dragActive && (
        <p className="text-xs text-primary font-medium animate-pulse">Thả ảnh vào đây...</p>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
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
