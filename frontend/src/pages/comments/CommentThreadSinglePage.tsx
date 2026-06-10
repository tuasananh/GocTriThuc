import { useParams, useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { SectionHeader } from '@/components/SectionHeader';
import { ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommentThread } from '@/components/CommentThread';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { CommentDto } from '@/types';
import { ErrorState } from '@/components/ErrorState';
import { useAuth } from '@/contexts/AuthContext';

export function CommentThreadSinglePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comment, setComment] = useState<CommentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Note: This endpoint might not be fully implemented in MSW yet,
    // so we handle errors gracefully to avoid breaking the UI.
    const fetchComment = async () => {
      try {
        const res = await api.get(`/api/comments/${id}`);
        setComment(res.data);
      } catch {
        setError('Không thể tải nhánh bình luận hoặc nhánh không tồn tại.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchComment();
    }
  }, [id]);

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

        {!loading && error && (
          <ErrorState
            icon={<MessageSquare className="w-12 h-12 text-muted-foreground" />}
            title="Không tìm thấy"
            message={error}
          />
        )}

        {!loading && comment && (
          <div className="bg-card rounded-xl p-6 border shadow-sm">
            <CommentThread
              comments={[comment]}
              currentUserId={user?.id}
              onPostComment={async () => {}} // Placeholder cho luồng xem chi tiết
              onReply={async () => {}}
              onEdit={async () => {}}
              onDelete={async () => {}}
            />
          </div>
        )}
      </div>
    </PageShell>
  );
}
