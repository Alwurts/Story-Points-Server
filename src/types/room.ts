import { User } from "./user";

export interface Room {
  id: string;
  topic: string;
  state: "inactive" | "waiting" | "voting" | "results";
  moderator: User | null;
  activeUsers: User[];
  hasBeenActiveUser: { [key: string]: User };
  votingSessionVotes: { [key: string]: string | null };
}
