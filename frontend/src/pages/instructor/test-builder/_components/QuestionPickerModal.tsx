import { useState, useEffect, useCallback, useRef } from 'react';
import { isAxiosError } from 'axios';
import { Loader2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { QuestionDto, PageResponse } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RichTextViewer } from '@/components/rich-text-editor/RichTextViewer';

export function QuestionPickerModal({
  open,
  onClose,
  testId,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  testId: string;
  onAdded: (question: QuestionDto & { point: number; order: number }) => void;
}) {
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);

  const searchRequestRef = useRef(0);

  // Simple debounce
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchQuestions = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    const reqId = ++searchRequestRef.current;
    try {
      const res = await api.get<PageResponse<QuestionDto>>('/api/questions', {
        params: { search: debouncedSearch, size: 50 },
      });
      if (reqId === searchRequestRef.current) {
        setQuestions(res.data.content || []);
      }
    } catch {
      if (reqId === searchRequestRef.current) {
        toast.error('Không thể tải danh sách câu hỏi');
      }
    } finally {
      if (reqId === searchRequestRef.current) {
        setLoading(false);
      }
    }
  }, [open, debouncedSearch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQuestions();
  }, [fetchQuestions]);

  const handleAdd = async (q: QuestionDto) => {
    setAddingId(q.id);
    try {
      // Default point is 1, order is handled by backend or length
      const point = 1;
      await api.post(`/api/tests/${testId}/questions`, {
        questionId: q.id,
        order: null,
        point,
      });
      toast.success('Đã thêm câu hỏi vào đề thi');
      onAdded({ ...q, point, order: 0 });
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response) {
        const status = err.response.status;
        const msg = err.response.data?.message;

        if (status === 409) {
          if (msg === 'Question is already added to this test') {
            toast.error('Câu hỏi này đã được thêm vào bài kiểm tra.');
          } else if (msg === 'Order is already taken for this test') {
            toast.error('Thứ tự câu hỏi đã tồn tại trong bài kiểm tra.');
          } else {
            toast.error(msg || 'Xung đột dữ liệu khi thêm câu hỏi.');
          }
        } else if (status === 404) {
          if (msg === 'Question not found') {
            toast.error('Không tìm thấy câu hỏi.');
          } else if (msg === 'Test not found') {
            toast.error('Không tìm thấy bài kiểm tra.');
          } else {
            toast.error(msg || 'Không tìm thấy dữ liệu.');
          }
        } else if (status === 400) {
          toast.error(msg || 'Yêu cầu không hợp lệ.');
        } else if (status === 403 || status >= 500) {
          // Interceptor already toasts for 403 and 500+ errors, skip here
        } else {
          toast.error(msg || 'Không thể thêm câu hỏi');
        }
      } else {
        toast.error('Không thể kết nối đến server.');
      }
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Thêm câu hỏi từ ngân hàng đề</DialogTitle>
        </DialogHeader>

        <div className="p-4 border-b bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm câu hỏi..."
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Không tìm thấy câu hỏi nào.
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border bg-card hover:bg-muted/10 transition-colors flex gap-4 items-start"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {q.questionType === 'multiple_choice' ? 'Trắc nghiệm' : q.questionType}
                      </Badge>
                      {q.isSingleChoice ? (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-primary/5 text-primary border-primary/20"
                        >
                          1 Đáp án
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-amber-50 text-amber-600 border-amber-200"
                        >
                          Nhiều đáp án
                        </Badge>
                      )}
                    </div>
                    <div className="max-h-[3.5rem] overflow-hidden relative mb-2">
                      <div className="font-medium text-sm">
                        <RichTextViewer htmlContent={q.statement} />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {q.choices.slice(0, 2).map((choice, i) => (
                        <div key={i} className="flex items-start gap-1.5 truncate">
                          <div className="w-1 h-1 mt-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                          <div className="truncate min-w-0">
                            <RichTextViewer htmlContent={choice} />
                          </div>
                        </div>
                      ))}
                      {q.choices.length > 2 && (
                        <div className="text-muted-foreground/70 italic mt-1">
                          + {q.choices.length - 2} đáp án khác...
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => handleAdd(q)}
                    disabled={addingId === q.id}
                  >
                    {addingId === q.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Thêm
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
