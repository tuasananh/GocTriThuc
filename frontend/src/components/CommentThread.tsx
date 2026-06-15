import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTE_PATTERNS } from '@/lib/routes';
import { useIsAdmin } from '@/lib/permissions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/EmptyState';
import { cn } from '@/lib/utils';
import { MessageSquare, Loader2 } from 'lucide-react';
import type { CommentDto } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CommentItemProps {
  comment: CommentDto;
  depth: number;
  currentUserId?: string;
  contextType: 'lesson' | 'announcement';
  contextId: string;
  onReply: (content: string, parentId: string) => Promise<void>;
  onEdit: (id: string, newContent: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isAdmin?: boolean;
}

function CommentItem({
  comment,
  depth,
  currentUserId,
  contextType,
  contextId,
  onReply,
  onEdit,
  onDelete,
  isAdmin,
}: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const [submitting, setSubmitting] = useState(false);

  // Depth check for Reddit-style redirection
  const isDeep = depth >= 4;

  const [isEditable, setIsEditable] = useState(() => {
    if (comment.author.id === currentUserId) {
      return Date.now() - new Date(comment.createdAt).getTime() <= 15 * 60 * 1000;
    }
    return false;
  });

  useEffect(() => {
    if (!isEditable) return;
    const remaining = 15 * 60 * 1000 - (Date.now() - new Date(comment.createdAt).getTime());
    if (remaining <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsEditable(false);
      return;
    }
    const timer = setTimeout(() => setIsEditable(false), remaining);
    return () => clearTimeout(timer);
  }, [isEditable, comment.createdAt]);

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      await onReply(replyContent, comment.id);
      setReplyContent('');
      setShowReply(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      return;
    }
    setSubmitting(true);
    try {
      await onEdit(comment.id, editContent);
      setIsEditing(false);
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn('mt-4', depth > 0 && 'pl-4 border-l-2 border-border/50')}>
      <div className="flex gap-3 items-start">
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={comment.author.avatarUrl || ''} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {getInitials(comment.author.displayName || 'U')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="bg-muted/40 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{comment.author.displayName}</p>
              {comment.editedAt && (
                <span className="text-xs text-muted-foreground/80">(Đã chỉnh sửa)</span>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  className="min-h-[60px] text-sm resize-none"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (editContent.trim() && !submitting) {
                        handleEditSubmit();
                      }
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                    disabled={submitting}
                  >
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleEditSubmit}
                    disabled={!editContent.trim() || submitting}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu thay đổi'}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
            )}
          </div>

          {isDeep ? (
            <Link
              to={ROUTE_PATTERNS.COMMENT_THREAD.replace(':type', contextType)
                .replace(':contextId', contextId)
                .replace(':commentId', comment.id)}
              className="text-xs text-primary hover:underline font-medium block mt-2 ml-2"
            >
              Xem riêng nhánh thảo luận này →
            </Link>
          ) : (
            <div className="flex items-center gap-4 mt-1.5 ml-2">
              <button
                onClick={() => setShowReply(!showReply)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Trả lời
              </button>
              {isEditable && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sửa
                </button>
              )}
              {(comment.author.id === currentUserId || isAdmin) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="text-xs font-medium text-destructive/80 hover:text-destructive transition-colors">
                      Xóa
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xóa bình luận này?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bình luận và tất cả phản hồi bên dưới sẽ bị xóa vĩnh viễn. Hành động này
                        không thể hoàn tác.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(comment.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Xóa vĩnh viễn
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <span className="text-xs text-muted-foreground/60 ml-auto">
                {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
          )}

          {showReply && !isDeep && (
            <div className="mt-3 pl-2 flex gap-2 items-start">
              <Textarea
                className="min-h-[60px] text-sm resize-none"
                placeholder="Viết phản hồi..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (replyContent.trim() && !submitting) {
                      handleReplySubmit();
                    }
                  }
                }}
              />
              <Button
                size="sm"
                className="shrink-0"
                onClick={handleReplySubmit}
                disabled={!replyContent.trim() || submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gửi'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {!isDeep && comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-1">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              currentUserId={currentUserId}
              contextType={contextType}
              contextId={contextId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export interface CommentThreadProps {
  comments: CommentDto[];
  currentUserId?: string;
  contextType: 'lesson' | 'announcement';
  contextId: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onPostComment: (content: string) => Promise<void>;
  onReply: (content: string, parentId: string) => Promise<void>;
  onEdit: (id: string, newContent: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CommentThread({
  comments,
  currentUserId,
  contextType,
  contextId,
  hasMore,
  onLoadMore,
  onPostComment,
  onReply,
  onEdit,
  onDelete,
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isAdmin = useIsAdmin();

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await onPostComment(newComment);
      setNewComment('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Root comment input */}
      <div className="flex gap-3 items-start">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary">ME</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            className="min-h-[80px] resize-none"
            placeholder="Tham gia thảo luận..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (newComment.trim() && !submitting) {
                  handleSubmit();
                }
              }
            }}
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={!newComment.trim() || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                'Đăng bình luận'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Thread list */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            depth={0}
            currentUserId={currentUserId}
            contextType={contextType}
            contextId={contextId}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            isAdmin={isAdmin}
          />
        ))}
        {comments.length === 0 && (
          <EmptyState
            icon={MessageSquare}
            title="Chưa có bình luận nào"
            description="Hãy là người đầu tiên tham gia thảo luận!"
          />
        )}

        {hasMore && onLoadMore && (
          <div className="flex justify-center mt-6">
            <Button variant="outline" onClick={onLoadMore} className="w-full sm:w-auto">
              Tải thêm bình luận
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
