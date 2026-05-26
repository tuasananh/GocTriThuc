import { http, HttpResponse, delay } from 'msw';
import { courseHandlers } from './handlers/courses';
import { moduleHandlers } from './handlers/modules';
import { questionHandlers } from './handlers/questions';
import { fileHandlers } from './handlers/files';

/**
 * Auth handler — giả lập user đã đăng nhập.
 * Đổi `authenticated: false` để test trạng thái chưa đăng nhập.
 */
const authHandlers = [
  http.get('/api/users/me', async () => {
    await delay(200);
    // Mặc định là true (đăng nhập) để lập trình viên dễ dev.
    // Sẽ đổi thành false khi họ click Đăng xuất.
    const isMockAuthenticated = localStorage.getItem('mock_authenticated') !== 'false';

    if (!isMockAuthenticated) {
      return HttpResponse.json({ authenticated: false });
    }

    return HttpResponse.json({
      authenticated: true,
      displayName: 'Nguyễn Công Vinh',
      email: 'vinh@example.com',
      avatarUrl: null,
      username: 'vinh_nc',
      roles: ['teacher'],
      permissions: '62', // 0x3E = teacher (bits 1-5)
    });
  }),
  http.post('/api/logout', async () => {
    await delay(200);
    localStorage.setItem('mock_authenticated', 'false');
    return HttpResponse.json({ success: true });
  }),
];

/**
 * Tất cả mock handlers — import vào browser.ts
 */
export const handlers = [
  ...authHandlers,
  ...courseHandlers,
  ...moduleHandlers,
  ...questionHandlers,
  ...fileHandlers,
];
