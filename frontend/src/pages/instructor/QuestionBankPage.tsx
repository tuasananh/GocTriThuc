import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  BookOpen,
  Edit2,
  Trash2,
  Plus,
  Search,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { QuestionDto, PageResponse } from '@/types';
import { PageShell } from '@/components/PageShell';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonCard } from '@/components/SkeletonCard';
import { RichTextViewer } from '@/components/rich-text-editor/RichTextViewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { QuestionForm } from './_components/QuestionForm';

export function QuestionBankPage() {
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionDto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const requestRef = useRef(0);

  // ── Debounce search + reset page ─────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0); // Reset về trang đầu khi thay đổi search
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Fetch questions ───────────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const reqId = ++requestRef.current;
    try {
      const res = await api.get<PageResponse<QuestionDto>>('/api/questions', {
        params: { search: debouncedSearch, page, size: 20 },
      });
      if (reqId === requestRef.current) {
        setQuestions(res.data.content ?? []);
        setTotalPages(res.data.totalPages ?? 0);
      }
    } catch {
      if (reqId === requestRef.current) {
        setError('Không thể tải danh sách câu hỏi. Vui lòng thử lại.');
      }
    } finally {
      if (reqId === requestRef.current) {
        setLoading(false);
      }
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQuestions();
  }, [fetchQuestions]);

  // ── Xử lý sau khi lưu (tạo hoặc sửa) ─────────────────────────
  const handleSaved = (saved: QuestionDto) => {
    if (editingQuestion) {
      // Cập nhật trong list
      setQuestions((prev) => prev.map((q) => (q.id === saved.id ? saved : q)));
      setEditingQuestion(null);
    } else {
      // Thêm câu hỏi mới vào đầu danh sách
      setQuestions((prev) => [saved, ...prev]);
      setShowCreateForm(false);
    }
  };

  // ── Xóa câu hỏi ──────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/api/questions/${id}`);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      toast.success('Đã xóa câu hỏi');
    } catch {
      toast.error('Không thể xóa câu hỏi. Vui lòng thử lại.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageShell>
      <SectionHeader
        title="Ngân hàng câu hỏi"
        description="Quản lý toàn bộ câu hỏi của bạn. Câu hỏi ở đây có thể được dùng trong nhiều bài kiểm tra khác nhau."
        action={
          <Button
            onClick={() => {
              setShowCreateForm(true);
              setEditingQuestion(null);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Tạo câu hỏi mới
          </Button>
        }
      />

      <div className="mt-6">
        {/* ── Danh sách câu hỏi ──────────────────────────────────── */}
        <div>
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm câu hỏi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Loading state */}
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Error state */}
          {!loading && error && <ErrorState message={error} onRetry={fetchQuestions} />}

          {/* Empty state */}
          {!loading && !error && questions.length === 0 && (
            <EmptyState
              icon={BookOpen}
              title={debouncedSearch ? 'Không tìm thấy câu hỏi phù hợp' : 'Ngân hàng câu hỏi trống'}
              description={
                debouncedSearch
                  ? `Không có câu hỏi nào khớp với "${debouncedSearch}"`
                  : 'Hãy tạo câu hỏi đầu tiên để bắt đầu xây dựng ngân hàng đề của bạn.'
              }
              action={
                !debouncedSearch && (
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo câu hỏi ngay
                  </Button>
                )
              }
            />
          )}

          {/* Data state — Question cards */}
          {!loading && !error && questions.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {questions.length} câu hỏi trên trang này
                {debouncedSearch && ` phù hợp với "${debouncedSearch}"`}
              </p>
              {questions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  isDeleting={deletingId === q.id}
                  onEdit={() => {
                    setEditingQuestion(q);
                    setShowCreateForm(false);
                  }}
                  onDelete={() => handleDelete(q.id)}
                />
              ))}

              {/* ── Phân trang ─────────────────────────────────── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Trước
                  </Button>

                  <span className="text-sm text-muted-foreground px-2">
                    Trang {page + 1} / {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sau
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Dialog
        open={showCreateForm || !!editingQuestion}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateForm(false);
            setEditingQuestion(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Sửa câu hỏi' : 'Tạo câu hỏi mới'}</DialogTitle>
          </DialogHeader>
          {(showCreateForm || editingQuestion) && (
            <QuestionForm
              key={editingQuestion ? `modal-${editingQuestion.id}` : 'new'}
              initialData={editingQuestion ?? undefined}
              onSaved={handleSaved}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ── QuestionCard sub-component ───────────────────────────────────
function QuestionCard({
  question,
  isDeleting,
  onEdit,
  onDelete,
}: {
  question: QuestionDto;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="group relative transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-border/60">
      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                Trắc nghiệm
              </Badge>
              {question.isSingleChoice ? (
                <Badge
                  variant="outline"
                  className="text-xs bg-primary/5 text-primary border-primary/20"
                >
                  1 Đáp án
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-xs bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/30"
                >
                  Nhiều đáp án
                </Badge>
              )}
            </div>
            <div className="font-medium text-foreground text-sm leading-relaxed">
              <RichTextViewer htmlContent={question.statement} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
              title="Sửa câu hỏi"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  disabled={isDeleting}
                  title="Xóa câu hỏi"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xóa câu hỏi này?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Câu hỏi sẽ bị xóa vĩnh viễn khỏi ngân hàng đề và tất cả bài kiểm tra đang sử
                    dụng nó. Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Xóa vĩnh viễn
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Separator className="mb-3" />

        {/* Choices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {question.choices.map((choice, i) => {
            const isCorrect = question.correctChoices?.includes(i);
            return (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                  isCorrect
                    ? 'bg-green-50 text-green-800 border border-green-200/60 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800/30'
                    : 'bg-muted/40 text-muted-foreground border border-transparent'
                }`}
              >
                {isCorrect ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
                )}
                <div className={cn('flex-1 min-w-0', isCorrect && 'font-medium')}>
                  <RichTextViewer htmlContent={choice} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-3 text-xs text-muted-foreground">
          {new Date(question.updatedAt).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </div>
      </CardContent>
    </Card>
  );
}
