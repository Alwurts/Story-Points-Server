import { Socket } from "socket.io";

export interface SocketRoom extends Socket {
  userId?: string;
  sessionId?: string;
  roomId?: string;
}
