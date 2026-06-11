import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { AnnouncementDto, PageResponse, CommentDto } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageSquare, Plus } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { CommentThread } from '@/components/CommentThread';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function AnnouncementsFeed({ courseId, isAuthor }: { courseId: string; isAuthor: boolean }) {
  const [announcements, setAnnouncements] = useState<AnnouncementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const auth = useAuth();
  const currentUserId = auth?.user?.id;

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PageResponse<AnnouncementDto>>(`/api/courses/${courseId}/announcements`, {
        params: { size: 20, page: 0 },
      });
      setAnnouncements(res.data.content);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải thông báo.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;
    setCreating(true);
    try {
      const res = await api.post<AnnouncementDto>(`/api/courses/${courseId}/announcements`, {
        title,
        content,
      });
      setAnnouncements((prev) => [res.data, ...prev]);
      setShowForm(false);
      setTitle('');
      setContent('');
      toast.success('Tạo thông báo thành công.');
    } catch (err) {
      console.error(err);
      toast.error('Không thể tạo thông báo.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto py-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bảng tin</h2>
        {isAuthor && !showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Đăng thông báo
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 space-y-4">
            <div>
              <Input
                placeholder="Tiêu đề thông báo..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-semibold text-lg bg-background"
              />
            </div>
            <div>
              <Textarea
                placeholder="Nội dung thông báo..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] bg-background"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreate} disabled={creating || !title.trim() || !content.trim()}>
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Đăng tin
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {announcements.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Chưa có thông báo nào"
          description="Giảng viên chưa đăng thông báo nào cho khóa học này."
        />
      ) : (
        <div className="space-y-6">
          {announcements.map((announcement) => (
            <AnnouncementItem
              key={announcement.id}
              announcement={announcement}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AnnouncementItem({
  announcement,
  currentUserId,
}: {
  announcement: AnnouncementDto;
  currentUserId?: string;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await api.get<CommentDto[]>(`/api/announcements/${announcement.id}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const handlePostComment = async (content: string) => {
    const res = await api.post<CommentDto>(`/api/announcements/${announcement.id}/comments`, {
      content,
    });
    setComments((prev) => [res.data, ...prev]);
  };

  const handleReply = async (content: string, parentId: string) => {
    const res = await api.post<CommentDto>(`/api/announcements/${announcement.id}/comments`, {
      content,
      parentId,
    });
    // Helper to recursively add reply to the correct parent
    const addReply = (nodes: CommentDto[]): CommentDto[] => {
      return nodes.map((n) => {
        if (n.id === parentId) {
          return { ...n, replies: [res.data, ...(n.replies || [])] };
        }
        if (n.replies) {
          return { ...n, replies: addReply(n.replies) };
        }
        return n;
      });
    };
    setComments((prev) => addReply(prev));
  };

  const handleEdit = async (id: string, newContent: string) => {
    const res = await api.put<CommentDto>(`/api/announcements/comments/${id}`, {
      content: newContent,
    });
    const updateNode = (nodes: CommentDto[]): CommentDto[] => {
      return nodes.map((n) => {
        if (n.id === id) {
          return { ...n, content: res.data.content, editedAt: res.data.editedAt, updatedAt: res.data.updatedAt };
        }
        if (n.replies) {
          return { ...n, replies: updateNode(n.replies) };
        }
        return n;
      });
    };
    setComments((prev) => updateNode(prev));
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/api/announcements/comments/${id}`);
    const removeNode = (nodes: CommentDto[]): CommentDto[] => {
      return nodes.filter((n) => n.id !== id).map((n) => ({
        ...n,
        replies: n.replies ? removeNode(n.replies) : [],
      }));
    };
    setComments((prev) => removeNode(prev));
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/20 pb-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-3 items-center">
            <Avatar>
              <AvatarImage src={announcement.author.avatarUrl || ''} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {announcement.author.displayName?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{announcement.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Đăng bởi <span className="font-medium text-foreground">{announcement.author.displayName}</span> •{' '}
                {new Date(announcement.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="whitespace-pre-wrap text-sm leading-relaxed mb-6">
          {announcement.content}
        </div>
        
        <div className="pt-4 border-t">
          <Button variant="ghost" size="sm" onClick={handleToggleComments} className="text-muted-foreground hover:text-foreground">
            <MessageSquare className="w-4 h-4 mr-2" />
            Bình luận
          </Button>
        </div>

        {showComments && (
          <div className="mt-6 pt-6 border-t animate-in slide-in-from-top-2 duration-300">
            {loadingComments ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <CommentThread
                comments={comments}
                currentUserId={currentUserId}
                contextType="announcement"
                contextId={announcement.id}
                onPostComment={handlePostComment}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
