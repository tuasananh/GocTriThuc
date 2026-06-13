export interface AdminUserResponse {
  id: string;
  email: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  roles: string[];
}
