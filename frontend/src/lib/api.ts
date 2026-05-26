import axios from 'axios';
import { toast } from 'sonner';

/**
 * Axios instance dùng chung cho toàn app.
 *
 * ✅ Dùng: import { api } from '@/lib/api';
 * ❌ Không dùng: import axios from 'axios';
 *
 * Đã cấu hình sẵn:
 * - withCredentials (gửi session cookie)
 * - CSRF token headers
 * - Interceptor xử lý lỗi 401, 403, 500
 */
const api = axios.create({
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

// ── Response Interceptor ─────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!axios.isAxiosError(error) || !error.response) {
      toast.error('Không thể kết nối đến server.');
      return Promise.reject(error);
    }

    const { status } = error.response;

    switch (status) {
      case 401:
        // Chưa đăng nhập → redirect về login
        // (chỉ redirect nếu không phải đang ở trang login)
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
        break;
      case 403:
        toast.error('Bạn không có quyền thực hiện hành động này.');
        break;
      case 409:
        // Conflict — thường do duplicate data, để component tự xử lý
        break;
      case 422:
        // Validation error — để component tự xử lý field errors
        break;
      default:
        if (status >= 500) {
          toast.error('Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.');
        }
    }

    return Promise.reject(error);
  },
);

export { api };
