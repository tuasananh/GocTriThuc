export class CurrentUser {
  displayName: string;
  email: string;
  avatarUrl: string;
  username: string;
  roles: string[];
  permissions: bigint;

  constructor(
    displayName: string,
    email: string,
    avatarUrl: string,
    username: string,
    roles: string[],
    permissions: string,
  ) {
    this.displayName = displayName;
    this.email = email;
    this.avatarUrl = avatarUrl;
    this.username = username;
    this.roles = roles;
    this.permissions = BigInt(permissions);
  }
}
