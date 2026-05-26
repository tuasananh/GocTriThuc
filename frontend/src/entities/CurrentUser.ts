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
