// ============================================================
// User DTOs — Dùng cho hiển thị thông tin người dùng
// ============================================================

/** Thông tin user rút gọn hiển thị trong cards, comments, etc. */
export interface UserDto {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

/** Thông tin user đầy đủ (dùng cho profile, admin) */
export interface UserDetailDto extends UserDto {
  email: string;
  roles: string[];
  permissions: string; // bigint as string
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Request body cho PATCH /api/users/{id} */
export interface UpdateUserRequest {
  displayName?: string;
  username?: string;
  avatarUrl?: string;
}
