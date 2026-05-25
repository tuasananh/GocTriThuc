# Day 7 — Lesson Player & Completion

**Goal**: Students can watch video lessons (raw YouTube/Vimeo links) and read blog lessons (BlockNote HTML content). Completing a lesson marks it done and updates progress. Expose local file attachments.
**Done when**: All three lesson types render correctly for enrolled students. "Đánh dấu hoàn thành" button persists to DB.

---

## 🔴 Trung (BE Lead)

### Task 1 — Save video lesson content
`PUT /api/lessons/{id}/video`:
```java
@PutMapping("/{id}/video")
public ResponseEntity<Void> updateVideo(
    @PathVariable Long id,
    @Valid @RequestBody UpdateVideoRequest req,
    Authentication auth) {
  lessonService.assertIsInstructorOfLesson(id, getCurrentUserId(auth));
  lessonVideoRepo.findById(id).ifPresentOrElse(v -> {
    v.setProvider(req.provider());
    v.setProviderValue(req.providerValue()); // Raw pasted URL
    v.setUpdatedAt(Instant.now());
    lessonVideoRepo.save(v);
  }, () -> {
    LessonVideoEntity v = new LessonVideoEntity();
    v.setId(id);
    v.setProvider(req.provider());
    v.setProviderValue(req.providerValue()); // Raw pasted URL
    v.setCreatedAt(Instant.now()); v.setUpdatedAt(Instant.now());
    lessonVideoRepo.save(v);
  });
  return ResponseEntity.noContent().build();
}
```

### Task 2 — Save blog lesson content (HTML Sanitization Resolution)
`PUT /api/lessons/{id}/blog`:
Save HTML string, passing it through jsoup relaxed Safelist first before writing to database.

```java
@PutMapping("/{id}/blog")
public ResponseEntity<Void> updateBlog(
    @PathVariable Long id,
    @Valid @RequestBody UpdateBlogRequest req,
    Authentication auth) {
  lessonService.assertIsInstructorOfLesson(id, getCurrentUserId(auth));
  
  // HTML Sanitization to block XSS
  String sanitizedHtml = Jsoup.clean(req.content(), Safelist.relaxed());
  
  lessonBlogRepo.findById(id).ifPresentOrElse(b -> {
    b.setContent(sanitizedHtml);
    b.setUpdatedAt(Instant.now());
    lessonBlogRepo.save(b);
  }, () -> {
    LessonBlogEntity b = new LessonBlogEntity();
    b.setId(id);
    b.setContent(sanitizedHtml);
    b.setCreatedAt(Instant.now()); b.setUpdatedAt(Instant.now());
    lessonBlogRepo.save(b);
  });
  return ResponseEntity.noContent().build();
}
```

### Task 3 — Lesson completion & progress APIs
Standard completion trackers.

---

## 🔴 Anh (BE Dev / PM)

### Task 1 — Local File attachments mapping
Attach file registry IDs to course and lesson resources. Expose listing endpoints pointing to local disk downloads via `/api/files/serve/{fileId}`.

---

## 🔵 Vinh (FE Lead)

### Lesson Page Container & Video Player
File: `src/pages/lessons/_components/VideoLessonViewer.tsx`
Handles raw video links directly.

```tsx
export function VideoLessonViewer({ video }: { video: { provider: string; providerValue: string } }) {
  // Parse dynamic YouTube/Vimeo urls on the fly
  const extractEmbed = (url: string, provider: string) => {
    if (provider === 'youtube') {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      const id = (match && match[2].length === 11) ? match[2] : '';
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
```

---

## 🔵 Sâm (FE Dev 1)

### Blog Lesson Viewer (BlockNote Read-Only)
File: `src/pages/lessons/_components/BlogLessonViewer.tsx`
Use the `BlockNote` editor's read-only mode to render rich text blocks with high-fidelity formatting by parsing the stored HTML string into BlockNote blocks.

```tsx
import { useEffect } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

export function BlogLessonViewer({ blog }: { blog: { content: string } }) {
  const editor = useCreateBlockNote({
    initialContent: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      if (!blog.content?.trim()) {
        editor.replaceBlocks(editor.document, []);
        return;
      }

      const blocks = await editor.tryParseHTMLToBlocks(blog.content);
      if (!cancelled) {
        editor.replaceBlocks(editor.document, blocks);
      }
    }

    void loadContent();

    return () => {
      cancelled = true;
    };
  }, [blog.content, editor]);

  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <BlockNoteView editor={editor} editable={false} />
    </article>
  );
}
```

---

## 🔵 Tuấn (FE Dev 2)

### Resources Downloads Shelf
File: `src/pages/lessons/_components/LessonResourceList.tsx`
Exposes file attachment links pointing to `/api/files/serve/{id}` local server endpoints.

---

## ✅ End-of-Day Checklist
- [ ] Jsoup sanitizes incoming HTML strings correctly before writing.
- [ ] BlockNote read-only renders HTML rich text blocks with premium styling.
- [ ] Local file attachments serve correctly.
