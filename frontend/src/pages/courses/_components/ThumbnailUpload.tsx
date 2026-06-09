import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ImageIcon, Loader2, UploadCloud } from 'lucide-react';
import { fileServeUrl, type FileDto } from '@/types';

interface ThumbnailUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function ThumbnailUpload({ value, onChange }: ThumbnailUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh hợp lệ.');
      return;
    }

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

      const serveUrl = fileServeUrl(data.id);
      onChange(serveUrl);
    } catch {
      toast.error('Có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.');
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
    <div className="space-y-2">
      <div
        className={`relative flex flex-col items-center justify-center w-full h-32 md:h-40 border-2 border-dashed rounded-lg transition-colors overflow-hidden ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:bg-muted/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Chọn hoặc kéo thả ảnh bìa"
      >
        {value ? (
          <>
            <img src={value} alt="Thumbnail preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white text-sm font-medium">Nhấp để thay đổi ảnh</span>
            </div>
          </>
        ) : uploading ? (
          <div className="flex flex-col items-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="text-sm">Đang tải lên {progress}%</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-muted-foreground pointer-events-none">
            {dragActive ? (
              <UploadCloud className="w-8 h-8 text-primary animate-bounce mb-2" />
            ) : (
              <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
            )}
            <span className="text-sm">
              <span className="font-semibold text-primary">Nhấp để chọn</span> hoặc kéo thả ảnh vào
              đây
            </span>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept="image/*"
        className="hidden"
      />

      {value && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            className="h-8 text-destructive"
          >
            Xóa ảnh
          </Button>
        </div>
      )}
    </div>
  );
}
