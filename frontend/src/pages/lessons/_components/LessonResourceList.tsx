import type { FileDto } from '@/types/file';
import { fileServeUrl } from '@/types/file';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { File, Download } from 'lucide-react';

export function LessonResourceList({ resources }: { resources: FileDto[] }) {
  if (!resources || resources.length === 0) {
    return null;
  }

  return (
    <Card className="mt-8 border-border/50 bg-background/50 shadow-sm transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <File className="h-5 w-5 text-primary" />
          Tài liệu đính kèm
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2">
          {resources.map((resource) => (
            <li
              key={resource.id}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-background px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <File className="h-4 w-4" />
                </div>
                <span className="truncate text-sm font-medium text-foreground">
                  {resource.filename}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground hover:text-primary"
                asChild
              >
                <a
                  href={fileServeUrl(resource.id)}
                  download={resource.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Tải xuống
                </a>
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
