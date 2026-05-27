import { useAuth } from '@/contexts/AuthContext';

/**
 * Hằng số Permission bits — khớp với database `roles.permissions`.
 *
 * Dùng:
 *   import { PERMISSION, usePermission } from '@/lib/permissions';
 *   const canManageCourse = usePermission(PERMISSION.MANAGE_OWN_COURSES);
 *   {canManageCourse && <Button>Tạo khóa học</Button>}
 */
export const PERMISSION = {
  /** Bit 0: Quyền admin */
  ADMIN: 1n << 0n,
  /** Bit 1: Quản lý khóa học của mình */
  MANAGE_OWN_COURSES: 1n << 1n,
  /** Bit 2: Đăng ký khóa học */
  ENROLL_COURSE: 1n << 2n,
  /** Bit 3: Quản lý câu hỏi */
  MANAGE_OWN_QUESTIONS: 1n << 3n,
  /** Bit 4: Quản lý bài kiểm tra */
  MANAGE_OWN_TESTS: 1n << 4n,
  /** Bit 5: Truy cập bài kiểm tra */
  ACCESS_TESTS: 1n << 5n,
} as const;

// Aliases dễ đọc (khớp với backend Permission constants)
export const CREATE_COURSE = PERMISSION.MANAGE_OWN_COURSES;
export const CREATE_QUESTION = PERMISSION.MANAGE_OWN_QUESTIONS;
export const EDIT_ANY_COURSE = PERMISSION.ADMIN;

/**
 * Hook kiểm tra quyền của user hiện tại.
 *
 * @param bit - Permission bit cần kiểm tra (lấy từ PERMISSION.*)
 * @returns true nếu user có quyền đó
 *
 * Ví dụ:
 *   const canManageCourse = usePermission(PERMISSION.MANAGE_OWN_COURSES);
 */
export function usePermission(bit: bigint): boolean {
  const auth = useAuth();
  if (!auth || !auth.isAuthenticated) return false;
  return (auth.user.permissions & bit) === bit;
}

/**
 * Hook kiểm tra user có phải admin không.
 */
export function useIsAdmin(): boolean {
  return usePermission(PERMISSION.ADMIN);
}

/**
 * Hook kiểm tra user có phải instructor (teacher) không.
 */
export function useIsInstructor(): boolean {
  return usePermission(PERMISSION.MANAGE_OWN_COURSES);
}
