import { http, HttpResponse } from 'msw';

export const authHandlers = [
  http.get('/api/users/me', () => {
    return HttpResponse.json({
      authenticated: true,
      id: '1',
      displayName: 'Ngô Bá Khá',
      email: 'khaba@goctrithuc.com',
      avatarUrl: null,
      username: 'khaba',
      roles: ['INSTRUCTOR'],
      permissions: '62', // Tất cả các quyền trừ ADMIN (bit 0)
    });
  }),

  http.post('/api/logout', () => {
    return new HttpResponse(null, { status: 200 });
  }),
];
