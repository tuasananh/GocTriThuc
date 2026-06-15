import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TestSettingsFormProps {
  statement: string;
  onStatementChange: (value: string) => void;
  timeLimit: number;
  onTimeLimitChange: (value: number) => void;
  maxAttempts: number;
  onMaxAttemptsChange: (value: number) => void;
  onSave: () => void;
  saving: boolean;
}

export function TestSettingsForm({
  statement,
  onStatementChange,
  timeLimit,
  onTimeLimitChange,
  maxAttempts,
  onMaxAttemptsChange,
  onSave,
  saving,
}: TestSettingsFormProps) {
  return (
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
            onChange={(e) => onStatementChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Thời gian làm bài (phút)</Label>
          <Input
            type="number"
            min={1}
            max={180}
            placeholder="Nhập số phút (1 - 180)..."
            value={timeLimit === 0 ? '' : Math.floor(timeLimit / 60)}
            onChange={(e) => {
              const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
              onTimeLimitChange(isNaN(val) ? 0 : val * 60);
            }}
          />
          <p className="text-xs text-muted-foreground">Thời gian làm bài từ 1 đến 180 phút.</p>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Số lượt làm bài tối đa</Label>
          <Input
            type="number"
            min={0}
            placeholder="Không giới hạn"
            value={maxAttempts === 0 ? '' : maxAttempts}
            onChange={(e) => {
              const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
              onMaxAttemptsChange(isNaN(val) || val < 0 ? 0 : val);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Nhập số lượt làm bài cho phép. Nhập 0 hoặc để trống để không giới hạn.
          </p>
        </div>
        <Button className="w-full mt-2" onClick={onSave} disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </Button>
      </CardContent>
    </Card>
  );
}
