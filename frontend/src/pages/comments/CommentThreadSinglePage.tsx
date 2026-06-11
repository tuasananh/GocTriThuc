import { useParams, useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { SectionHeader } from '@/components/SectionHeader';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommentThread } from '@/components/CommentThread';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { CommentDto } from '@/types';
import { ErrorState } from '@/components/ErrorState';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function CommentThreadSinglePage() {
  const { type, contextId, commentId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const currentUserId = auth?.isAuthenticated ? auth.user.id : undefined;
  const [comment, setComment] = useState<CommentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComment = useCallback(async () => {
    if (!type || !contextId || !commentId) return;
    try {
      const res = await api.get(`/api/${type}s/${contextId}/comments/${commentId}`);
      setComment(res.data);
    } catch {
      setError('Không thể tải nhánh bình luận hoặc nhánh không tồn tại.');
    } finally {
      setLoading(false);
    }
  }, [type, contextId, commentId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchComment();
  }, [fetchComment]);

  const handlePostComment = async (content: string) => {
    if (!commentId) return;
    try {
      await api.post(`/api/${type}s/${contextId}/comments`, { content, parentId: commentId });
      toast.success('Đã gửi phản hồi');
      fetchComment();
    } catch {
      toast.error('Không thể gửi phản hồi. Vui lòng thử lại.');
    }
  };

  const handleReply = async (content: string, parentId: string) => {
    try {
      await api.post(`/api/${type}s/${contextId}/comments`, { content, parentId });
      toast.success('Đã gửi phản hồi');
      fetchComment();
    } catch {
      toast.error('Không thể gửi phản hồi. Vui lòng thử lại.');
    }
  };

  const handleEdit = async (id: string, newContent: string) => {
    try {
      await api.put(`/api/${type}s/${contextId}/comments/${id}`, { content: newContent });
      toast.success('Đã cập nhật bình luận');
      fetchComment();
    } catch {
      toast.error('Không thể cập nhật bình luận. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/${type}s/${contextId}/comments/${id}`);
      toast.success('Đã xóa bình luận');
      if (id === commentId) {
        navigate(-1);
      } else {
        fetchComment();
      }
    } catch {
      toast.error('Không thể xóa bình luận. Vui lòng thử lại.');
    }
  };

  if (!type || !contextId || !commentId) {
    return (
      <PageShell>
        <ErrorState title="Lỗi URL" message="Đường dẫn không hợp lệ" />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2 -ml-3 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Button>
      </div>

      <SectionHeader
        title="Nhánh thảo luận riêng"
        description="Xem chi tiết nhánh bình luận chuyên sâu."
      />

      <div className="mt-6 max-w-4xl">
        {loading && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-20">
            <Loader2 className="w-6 h-6 animate-spin" />
            Đang tải dữ liệu...
          </div>
        )}

        {!loading && error && <ErrorState title="Không tìm thấy" message={error} />}

        {!loading && comment && (
          <div className="bg-card rounded-xl p-6 border shadow-sm">
            <CommentThread
              comments={[comment]}
              currentUserId={currentUserId}
              contextType={type as 'lesson' | 'announcement'}
              contextId={contextId}
              onPostComment={handlePostComment}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>
    </PageShell>
  );
}
