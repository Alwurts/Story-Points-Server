import { Room } from "./room";
import { User, UserSession } from "./user";

export interface LocalStorage {
  users: { [key: string]: User };
  sessions: { [key: string]: UserSession };
  rooms: { [key: string]: Room };
}
