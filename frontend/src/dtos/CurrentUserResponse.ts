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
