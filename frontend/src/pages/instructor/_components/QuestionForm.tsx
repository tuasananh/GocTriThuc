import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, X, Loader2, HelpCircle } from 'lucide-react';
import { api } from '@/lib/api';
import type { QuestionDto, ApiError } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/rich-text-editor';

interface QuestionFormProps {
  onSaved: (q: QuestionDto) => void;
  /** Nếu truyền vào, form sẽ ở chế độ sửa câu hỏi */
  initialData?: QuestionDto;
}

export function QuestionForm({ onSaved, initialData }: QuestionFormProps) {
  const isEditing = !!initialData;

  const [statement, setStatement] = useState(initialData?.statement ?? '');
  const [choices, setChoices] = useState<string[]>(initialData?.choices ?? ['', '']);
  const [correctChoices, setCorrectChoices] = useState<number[]>(initialData?.correctChoices ?? []);
  const [isSingleChoice, setIsSingleChoice] = useState(initialData?.isSingleChoice ?? true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editorKey, setEditorKey] = useState(0);

  // ── Toggle đáp án đúng ───────────────────────────────────────
  const toggleCorrect = (idx: number) => {
    if (isSingleChoice) {
      setCorrectChoices([idx]);
    } else {
      setCorrectChoices((prev) =>
        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
      );
    }
  };

  // ── Khi toggle single/multi — reset correctChoices ───────────
  const handleToggleSingleChoice = (val: boolean) => {
    setIsSingleChoice(val);
    setCorrectChoices([]);
  };

  // ── Thêm đáp án ─────────────────────────────────────────────
  const addChoice = () => {
    if (choices.length < 6) {
      setChoices((prev) => [...prev, '']);
    }
  };

  // ── Xóa đáp án ──────────────────────────────────────────────
  const removeChoice = (idx: number) => {
    setChoices((prev) => prev.filter((_, i) => i !== idx));
    // Cập nhật correctChoices: bỏ idx, giảm index > idx xuống 1
    setCorrectChoices((prev) => prev.filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i)));
  };

  // ── Validate trước khi submit ────────────────────────────────
  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!statement.trim()) {
      errs.statement = 'Vui lòng nhập nội dung câu hỏi.';
    }
    const filledChoices = choices.map((c) => c.trim()).filter((c) => c !== '');
    if (filledChoices.length < 2) {
      errs.choices = 'Phải có ít nhất 2 đáp án không rỗng.';
    } else {
      const uniqueChoices = new Set(filledChoices);
      if (uniqueChoices.size < filledChoices.length) {
        errs.choices = 'Các đáp án không được trùng lặp.';
      }
    }
    if (correctChoices.length === 0) {
      errs.correctChoices = 'Vui lòng chọn ít nhất 1 đáp án đúng.';
    }
    // Kiểm tra correctChoices không vượt quá index hợp lệ
    if (correctChoices.some((idx) => idx < 0 || idx >= choices.length)) {
      errs.correctChoices = 'Đáp án đúng không hợp lệ.';
    }
    return errs;
  };

  // ── Submit ───────────────────────────────────────────────────
  const submit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    setErrors({});

    // Fix: Loại bỏ các đáp án rỗng và ánh xạ lại index của correctChoices
    const validChoicesWithOldIndex = choices
      .map((c, i) => ({ text: c.trim(), oldIndex: i }))
      .filter((c) => c.text !== '');

    const finalChoices = validChoicesWithOldIndex.map((c) => c.text);
    const finalCorrectChoices = correctChoices
      .map((oldIdx) => validChoicesWithOldIndex.findIndex((c) => c.oldIndex === oldIdx))
      .filter((newIdx) => newIdx !== -1);

    if (finalCorrectChoices.length === 0) {
      setErrors({ correctChoices: 'Vui lòng chọn ít nhất 1 đáp án đúng không rỗng.' });
      setSaving(false);
      return;
    }

    const payload = {
      statement: statement.trim(),
      choices: finalChoices,
      correctChoices: finalCorrectChoices,
      isSingleChoice,
    };

    try {
      let saved: QuestionDto;
      if (isEditing && initialData) {
        const res = await api.put<QuestionDto>(`/api/questions/${initialData.id}`, payload);
        saved = res.data;
        toast.success('Đã cập nhật câu hỏi');
      } else {
        const res = await api.post<QuestionDto>('/api/questions', payload);
        saved = res.data;
        toast.success('Đã tạo câu hỏi mới');
        // Reset form sau khi tạo mới thành công
        setStatement('');
        setChoices(['', '']);
        setCorrectChoices([]);
        setIsSingleChoice(true);
        setEditorKey((k) => k + 1);
      }
      onSaved(saved);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: ApiError } };
        const apiErrors = axiosErr.response?.data?.errors ?? {};
        const apiMessage = axiosErr.response?.data?.message;
        if (Object.keys(apiErrors).length > 0) {
          setErrors(apiErrors);
        } else if (apiMessage) {
          toast.error(apiMessage);
        } else {
          toast.error('Không thể lưu câu hỏi. Vui lòng thử lại.');
        }
      } else {
        toast.error('Đã xảy ra lỗi không xác định.');
      }
    } finally {
      setSaving(false);
    }
  };

  const canSubmit =
    !saving &&
    correctChoices.length > 0 &&
    statement.trim() !== '' &&
    choices.filter((c) => c.trim()).length >= 2;

  return (
    <div className="space-y-6">
      {/* ── Nội dung câu hỏi ─────────────────────────────────── */}
      <div className="space-y-2">
        <Label className="font-medium flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-primary" />
          Nội dung câu hỏi <span className="text-destructive">*</span>
        </Label>
        <RichTextEditor
          key={editorKey}
          initialHtml={initialData?.statement}
          onChange={async (editor) => {
            const html = await editor.blocksToHTMLLossy(editor.document);
            setStatement(html);
            if (errors.statement) setErrors((p) => ({ ...p, statement: '' }));
          }}
        />
        {errors.statement && <p className="text-xs text-destructive mt-1">{errors.statement}</p>}
      </div>

      {/* ── Toggle đơn / nhiều đáp án ────────────────────────── */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
        <Switch
          id="single-choice"
          checked={isSingleChoice}
          onCheckedChange={handleToggleSingleChoice}
        />
        <div>
          <Label htmlFor="single-choice" className="cursor-pointer font-medium">
            {isSingleChoice ? 'Một đáp án đúng' : 'Nhiều đáp án đúng'}
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isSingleChoice
              ? 'Học viên chỉ được chọn 1 đáp án duy nhất'
              : 'Học viên có thể chọn nhiều đáp án'}
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            isSingleChoice
              ? 'ml-auto bg-primary/5 text-primary border-primary/20'
              : 'ml-auto bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/30'
          }
        >
          {isSingleChoice ? 'Radio' : 'Checkbox'}
        </Badge>
      </div>

      {/* ── Danh sách đáp án ─────────────────────────────────── */}
      <div className="space-y-3">
        <Label className="font-medium">
          Đáp án{' '}
          <span className="text-muted-foreground font-normal text-xs">
            (bấm vào radio/checkbox để chọn đáp án đúng)
          </span>
        </Label>

        <div className="space-y-2">
          {choices.map((choice, i) => {
            const isCorrect = correctChoices.includes(i);
            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                  isCorrect
                    ? 'border-green-500/40 bg-green-50/60 dark:bg-green-900/10'
                    : 'border-border/60 bg-background hover:bg-muted/20'
                }`}
              >
                {/* Radio / Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleCorrect(i)}
                  className={`shrink-0 w-5 h-5 rounded-${isSingleChoice ? 'full' : 'sm'} border-2 transition-all duration-150 flex items-center justify-center ${
                    isCorrect
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-muted-foreground/40 bg-background hover:border-primary/60'
                  }`}
                  title={isCorrect ? 'Đáp án đúng' : 'Chọn làm đáp án đúng'}
                >
                  {isCorrect && (
                    <svg viewBox="0 0 12 12" className="w-3 h-3 fill-current" aria-hidden>
                      {isSingleChoice ? (
                        <circle cx="6" cy="6" r="3" />
                      ) : (
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                        />
                      )}
                    </svg>
                  )}
                </button>

                {/* Input đáp án */}
                <Input
                  value={choice}
                  onChange={(e) => {
                    const next = [...choices];
                    next[i] = e.target.value;
                    setChoices(next);
                    if (errors.choices) setErrors((p) => ({ ...p, choices: '' }));
                  }}
                  placeholder={`Đáp án ${i + 1}`}
                  className={`flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 h-auto text-sm ${
                    isCorrect ? 'text-green-800 dark:text-green-200 font-medium' : ''
                  }`}
                />

                {/* Nút xóa (chỉ hiển thị khi có > 2 đáp án) */}
                {choices.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeChoice(i)}
                    title="Xóa đáp án"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Nút thêm đáp án */}
        {choices.length < 6 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addChoice}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Thêm đáp án
          </Button>
        )}

        {errors.choices && <p className="text-xs text-destructive">{errors.choices}</p>}
        {errors.correctChoices && (
          <p className="text-xs text-destructive">{errors.correctChoices}</p>
        )}
      </div>

      {/* ── Nút Lưu ────────────────────────────────────────────── */}
      <Button onClick={submit} disabled={!canSubmit} className="w-full transition-all duration-200">
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Đang lưu...
          </>
        ) : isEditing ? (
          'Cập nhật câu hỏi'
        ) : (
          'Lưu câu hỏi'
        )}
      </Button>
    </div>
  );
}
