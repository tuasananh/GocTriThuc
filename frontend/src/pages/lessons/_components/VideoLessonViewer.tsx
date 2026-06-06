export function VideoLessonViewer({
  video,
}: {
  video: { provider: string; providerValue: string };
}) {
  // Parse dynamic YouTube/Vimeo urls on the fly
  const extractEmbed = (url: string, provider: string) => {
    if (provider === 'youtube') {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
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
