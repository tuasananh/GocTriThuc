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

// ============================================================
// Auth context types
// ============================================================

export type CurrentUserResponse =
  | {
      authenticated: false;
      error: string | undefined;
    }
  | {
      authenticated: true;
      displayName: string | null;
      email: string;
      avatarUrl: string | null;
      username: string;
      roles: string[];
      permissions: string;
    };

export class CurrentUser {
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
  username: string;
  roles: string[];
  permissions: bigint;

  constructor(
    displayName: string | null | undefined,
    email: string,
    avatarUrl: string | null | undefined,
    username: string | undefined,
    roles: string[] | undefined,
    permissions: string | undefined,
  ) {
    this.displayName = displayName ?? null;
    this.email = email || '';
    this.avatarUrl = avatarUrl ?? null;
    this.username = username || '';
    this.roles = roles || [];
    this.permissions = BigInt(permissions || '0');
  }
}
