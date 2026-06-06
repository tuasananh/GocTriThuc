import { http, HttpResponse, delay } from 'msw';

// Giả lập Database lưu trạng thái User
const mockUser = {
  authenticated: true,
  id: '1',
  displayName: 'Ngô Bá Khá',
  email: 'khaba@goctrithuc.com',
  avatarUrl: null as string | null,
  username: 'khaba',
  roles: ['INSTRUCTOR'],
  permissions: '62', // Tất cả các quyền trừ ADMIN (bit 0)
};

export const authHandlers = [
  // ── GET /api/users/me ─────────────────────────────────
  http.get('/api/users/me', async () => {
    await delay(300);
    return HttpResponse.json(mockUser);
  }),

  // ── PATCH /api/users/me ───────────────────────────────
  http.patch('/api/users/me', async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as Partial<typeof mockUser>;

    // Giả lập lỗi trùng username
    if (body.username && body.username === 'admin') {
      return new HttpResponse(null, { status: 409 });
    }

    // Cập nhật state
    if (body.displayName !== undefined) mockUser.displayName = body.displayName;
    if (body.username !== undefined) mockUser.username = body.username;
    if (body.avatarUrl !== undefined) mockUser.avatarUrl = body.avatarUrl;

    return HttpResponse.json(mockUser);
  }),

  // ── POST /api/logout ──────────────────────────────────
  http.post('/api/logout', async () => {
    await delay(300);
    return new HttpResponse(null, { status: 200 });
  }),
];
