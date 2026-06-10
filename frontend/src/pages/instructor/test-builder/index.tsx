import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { LessonDetailDto, QuestionDto } from '@/types';
import { PageShell } from '@/components/PageShell';
import { SectionHeader } from '@/components/SectionHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, ArrowLeft } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { TestQuestionItem } from './_components/TestQuestionItem';
import { QuestionPickerModal } from './_components/QuestionPickerModal';

type TestQuestionItemType = QuestionDto & { point: number; order: number };

export function TestBuilderPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const [testId, setTestId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<TestQuestionItemType[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [statement, setStatement] = useState('');
  const [timeLimit, setTimeLimit] = useState(1800); // 30 min default
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!lessonId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    api
      .get<LessonDetailDto>(`/api/lessons/${lessonId}`)
      .then(async (r) => {
        if (r.data.test) {
          setTestId(r.data.test.testId);
          setStatement(r.data.test.statement || '');
          setTimeLimit(r.data.test.timeLimit || 1800);
          const qr = await api.get<TestQuestionItemType[]>(
            `/api/tests/${r.data.test.testId}/questions`,
          );
          setQuestions(qr.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load test details', err);
        toast.error('Không thể tải dữ liệu bài kiểm tra');
      })
      .finally(() => setLoading(false));
  }, [lessonId]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put(`/api/lessons/${lessonId}/test`, { statement, timeLimit });
      toast.success('Đã lưu cài đặt bài kiểm tra');
    } catch (err) {
      console.error('Save failed', err);
      toast.error('Không thể lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = async (questionId: string) => {
    try {
      await api.delete(`/api/tests/${testId}/questions/${questionId}`);
      setQuestions((q) => q.filter((x) => x.id !== questionId));
      toast.success('Đã xóa câu hỏi khỏi bài kiểm tra');
    } catch (err) {
      console.error('Remove failed', err);
      toast.error('Không thể xóa câu hỏi');
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 -ml-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <SectionHeader title="Thiết lập bài kiểm tra" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Settings panel */}
        <Card className="lg:col-span-1 border-primary/10 shadow-sm self-start">
          <CardHeader className="bg-primary/5 pb-4 border-b">
            <CardTitle className="text-lg flex items-center gap-2">Cài đặt chung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Đề bài / Hướng dẫn</Label>
              <Textarea
                rows={4}
                className="resize-none"
                placeholder="Nhập hướng dẫn làm bài cho học viên..."
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Thời gian làm bài</Label>
              <Select value={String(timeLimit)} onValueChange={(v) => setTimeLimit(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="900">15 phút</SelectItem>
                  <SelectItem value="1800">30 phút</SelectItem>
                  <SelectItem value="2700">45 phút</SelectItem>
                  <SelectItem value="3600">60 phút</SelectItem>
                  <SelectItem value="5400">90 phút</SelectItem>
                  <SelectItem value="7200">120 phút</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full mt-2" onClick={saveSettings} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
            </Button>
          </CardContent>
        </Card>

        {/* Question list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold tracking-tight">
              Danh sách câu hỏi ({questions.length})
            </h3>
            <Button onClick={() => setShowPicker(true)}>
              <Plus size={16} className="mr-2" /> Thêm câu hỏi
            </Button>
          </div>

          {questions.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                title="Chưa có câu hỏi nào"
                description="Hãy thêm câu hỏi từ Ngân hàng đề để bắt đầu xây dựng bài kiểm tra."
                action={<Button onClick={() => setShowPicker(true)}>Thêm câu hỏi ngay</Button>}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, i) => (
                <TestQuestionItem
                  key={q.id}
                  question={q}
                  index={i}
                  onRemove={() => removeQuestion(q.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {testId && (
        <QuestionPickerModal
          open={showPicker}
          onClose={() => setShowPicker(false)}
          testId={testId}
          onAdded={(q) => {
            // Prevent duplicate adding in UI
            if (!questions.find((existing) => existing.id === q.id)) {
              setQuestions((prev) => [...prev, q]);
            } else {
              toast.info('Câu hỏi này đã có trong đề thi');
            }
          }}
        />
      )}
    </PageShell>
  );
}
