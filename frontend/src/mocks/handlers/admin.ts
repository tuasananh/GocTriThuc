import { http, HttpResponse, delay } from 'msw';
import type { PageResponse, AdminUserResponse } from '@/types';

export const adminHandlers = [
  // ── GET /api/admin/users ──────────────────────────────────────
  http.get('/api/admin/users', async () => {
    await delay(300);
    const mockUsers: AdminUserResponse[] = [
      {
        id: '1',
        email: 'student@example.com',
        displayName: 'Học viên A',
        username: 'studentA',
        avatarUrl: null,
        roles: ['student'],
      },
      {
        id: '2',
        email: 'instructor@example.com',
        displayName: 'Giảng viên B',
        username: 'instructorB',
        avatarUrl: null,
        roles: ['student', 'teacher'],
      },
      {
        id: '3',
        email: 'admin@example.com',
        displayName: 'Admin C',
        username: 'adminC',
        avatarUrl: null,
        roles: ['student', 'teacher', 'admin'],
      },
    ];

    const response: PageResponse<AdminUserResponse> = {
      content: mockUsers,
      totalElements: mockUsers.length,
      totalPages: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
      empty: false,
    };

    return HttpResponse.json(response);
  }),

  // ── PUT /api/admin/users/:id/role ─────────────────────────────
  http.put('/api/admin/users/:id/role', async () => {
    await delay(300);
    return HttpResponse.json({}, { status: 204 });
  }),
];
