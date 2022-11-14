export interface UserDisplay {
  users: User[];
  className?: string;
}

export interface User extends UserClient {
  sessions: { [key: string]: UserSession };
  active?: boolean;
}

export interface UserClient {
  id: string;
  userName: string;
  color?: string;
}

export interface UserSession {
  id: string;
  roomId: string;
  userId: string;
  createAt: Date;
}
