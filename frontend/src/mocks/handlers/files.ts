import { http, HttpResponse, delay } from 'msw';

export const fileHandlers = [
  // ── POST /api/files/upload ─────────────────────────────────
  http.post('/api/files/upload', async () => {
    await delay(800); // giả lập upload chậm
    const mockFileId = String(Date.now());
    return HttpResponse.json(
      {
        id: mockFileId,
        providerValue: `uploads/mock-${mockFileId}.jpg`,
        mimeType: 'image/jpeg',
        originalName: `mock-${mockFileId}.jpg`,
        sizeBytes: 51200, // 50KB
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  // ── GET /api/files/serve/:id ───────────────────────────────
  // MSW không serve file thật — dùng placeholder image
  http.get('/api/files/serve/:id', async () => {
    await delay(100);
    // Redirect to a placeholder image
    return HttpResponse.redirect('https://placehold.co/400x300/e2e8f0/94a3b8?text=Image', 302);
  }),
];
