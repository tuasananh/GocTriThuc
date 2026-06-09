import { http, HttpResponse, delay } from 'msw';

export const fileHandlers = [
  // ── POST /api/files/upload ─────────────────────────────────
  http.post('/api/files/upload', async () => {
    await delay(800); // giả lập upload chậm
    const mockFileId = String(Date.now());
    return HttpResponse.json(
      {
        id: mockFileId,
        filename: `mock-${mockFileId}.jpg`,
        url: `/api/files/serve/${mockFileId}`,
      },
      { status: 201 },
    );
  }),

  // ── GET /api/files/serve/:id ───────────────────────────────
  // MSW không serve file thật — trả placeholder SVG inline (hoạt động offline & CI)
  http.get('/api/files/serve/:id', async () => {
    await delay(100);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#e2e8f0"/>
      <text x="200" y="150" text-anchor="middle" dominant-baseline="middle"
            font-family="sans-serif" font-size="18" fill="#94a3b8">Image</text>
    </svg>`;
    return new HttpResponse(svg, {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }),
];
