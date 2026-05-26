/**
 * Kiểu phản hồi phân trang từ Spring Boot (Page<T>).
 * Tất cả các endpoint trả danh sách đều dùng format này.
 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // trang hiện tại (0-indexed)
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/**
 * Phản hồi lỗi chuẩn từ backend (GlobalExceptionHandler).
 */
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string>; // field-level validation errors
  timestamp?: string;
}
