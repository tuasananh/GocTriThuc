import { http, HttpResponse, delay } from 'msw';

export const fileHandlers = [
  // ── POST /api/files/upload ─────────────────────────────────
  http.post('/api/files/upload', async () => {
    await delay(800); // giả lập upload chậm
    return HttpResponse.json(
      {
        id: Date.now(),
        providerValue: `uploads/mock-${Date.now()}.jpg`,
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
