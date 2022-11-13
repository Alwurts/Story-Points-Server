export interface UserDisplay {
  users: User[];
  className?: string;
}

export interface User extends UserClient {
  sessions: { [key: string]: UserSession };
  active?: boolean;
  color?: string;
}

export interface UserClient {
  id: string;
  userName: string;
}

export interface UserSession {
  id: string;
  roomId: string;
  userId: string;
  createAt: Date;
}
