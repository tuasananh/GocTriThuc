import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { BookOpen, Edit2, Trash2, Plus, Search, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import type { QuestionDto, PageResponse } from '@/types';
import { PageShell } from '@/components/PageShell';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonCard } from '@/components/SkeletonCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionDto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Debounce search ───────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Fetch questions ───────────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PageResponse<QuestionDto>>('/api/questions', {
        params: { search: debouncedSearch, size: 50 },
      });
      setQuestions(res.data.content ?? []);
    } catch {
      setError('Không thể tải danh sách câu hỏi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

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

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* ── Panel tạo / sửa câu hỏi ───────────────────────────── */}
        {(showCreateForm || editingQuestion) && (
          <div className="lg:col-span-1">
            <Card className="border-primary/20 shadow-sm sticky top-6">
              <CardHeader className="bg-primary/5 border-b pb-4">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{editingQuestion ? 'Sửa câu hỏi' : 'Tạo câu hỏi mới'}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingQuestion(null);
                    }}
                  >
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <QuestionForm
                  key={editingQuestion?.id ?? 'new'}
                  initialData={editingQuestion ?? undefined}
                  onSaved={handleSaved}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Danh sách câu hỏi ──────────────────────────────────── */}
        <div className={showCreateForm || editingQuestion ? 'lg:col-span-2' : 'lg:col-span-3'}>
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
                {questions.length} câu hỏi
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
            </div>
          )}
        </div>
      </div>

      {/* Edit modal (khi màn nhỏ, hiển thị dialog thay vì panel bên cạnh) */}
      <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sửa câu hỏi</DialogTitle>
          </DialogHeader>
          {editingQuestion && (
            <QuestionForm
              key={`modal-${editingQuestion.id}`}
              initialData={editingQuestion}
              onSaved={(saved) => {
                setQuestions((prev) => prev.map((q) => (q.id === saved.id ? saved : q)));
                setEditingQuestion(null);
              }}
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
            <p className="font-medium text-foreground text-sm leading-relaxed">
              {question.statement}
            </p>
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
                <span className={isCorrect ? 'font-medium' : ''}>{choice}</span>
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
