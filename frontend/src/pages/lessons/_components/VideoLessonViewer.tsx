import { VideoOff } from 'lucide-react';

export function VideoLessonViewer({
  video,
}: {
  video: { provider: string; providerValue: string };
}) {
  if (!video.providerValue || !video.providerValue.trim()) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/30 min-h-[300px]">
        <div className="p-4 bg-muted rounded-full mb-4 text-muted-foreground">
          <VideoOff className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Video chưa được cấu hình</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Bài học video này chưa được thiết lập liên kết video. Vui lòng quay lại sau.
        </p>
      </div>
    );
  }
  // Parse dynamic YouTube/Vimeo urls on the fly
  const extractEmbed = (url: string, provider: string) => {
    if (provider === 'youtube') {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      const id = match && match[2].length === 11 ? match[2] : '';
      return `https://www.youtube.com/embed/${id}`;
    } else {
      const match = url.match(/vimeo\.com\/(\d+)/);
      const id = match ? match[1] : '';
      return `https://player.vimeo.com/video/${id}`;
    }
  };

  const embedUrl = extractEmbed(video.providerValue, video.provider);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl shadow-lg bg-black">
      <iframe src={embedUrl} className="h-full w-full" allowFullScreen />
    </div>
  );
}
