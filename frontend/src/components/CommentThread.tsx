import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { CommentDto } from '@/types/comment';
import { Loader2 } from 'lucide-react';

interface CommentItemProps {
  comment: CommentDto;
  depth: number;
  currentUserId?: string;
  onReply: (content: string, parentId: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function CommentItem({ comment, depth, currentUserId, onReply, onDelete }: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Depth check for Reddit-style redirection
  const isDeep = depth >= 5;

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`mt-4 ${depth > 0 ? 'pl-4 border-l-2 border-border/50' : ''}`}>
      <div className="flex gap-3 items-start">
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={comment.author.avatarUrl || ''} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {getInitials(comment.author.displayName || 'U')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="bg-muted/40 rounded-xl px-4 py-3">
            <p className="text-sm font-semibold">{comment.author.displayName}</p>
            <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
          </div>

          {isDeep ? (
            <Link
              to={ROUTES.COMMENT_THREAD(comment.id)}
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
              {comment.author.id === currentUserId && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="text-xs font-medium text-destructive/80 hover:text-destructive transition-colors"
                >
                  Xóa
                </button>
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
              onReply={onReply}
              onDelete={onDelete}
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
  onPostComment: (content: string) => Promise<void>;
  onReply: (content: string, parentId: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CommentThread({
  comments,
  currentUserId,
  onPostComment,
  onReply,
  onDelete,
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
            onReply={onReply}
            onDelete={onDelete}
          />
        ))}
        {comments.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Chưa có bình luận nào. Hãy là người đầu tiên tham gia thảo luận!
          </p>
        )}
      </div>
    </div>
  );
}
