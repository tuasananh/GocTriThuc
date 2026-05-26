export class CurrentUser {
  displayName: string;
  email: string;
  avatarUrl: string;
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
    this.displayName = displayName || '';
    this.email = email || '';
    this.avatarUrl = avatarUrl || '';
    this.username = username || '';
    this.roles = roles || [];
    this.permissions = BigInt(permissions || '0');
  }
}
