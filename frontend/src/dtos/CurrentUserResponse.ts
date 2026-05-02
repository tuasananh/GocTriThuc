export type CurrentUserResponse =
  | {
      authenticated: false;
      error: string | undefined;
    }
  | {
      authenticated: true;
      displayName: string;
      email: string;
      avatarUrl: string;
      username: string;
      roles: string[];
      permissions: string;
    };
