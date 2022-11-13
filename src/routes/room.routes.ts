import express from "express";
import { Socket } from "socket.io";
import room from "../controllers/room.controller";
import {
  individualVote,
  joinRoom,
  startVoting,
} from "../controllers/room.socket.controller";

const router = express.Router();

router.post("/api/room/createroom", room.createRoom);
router.post("/api/room/validateroom", room.validateRoom);
router.post("/api/room/validateuserinroom", room.validateUserInRoom);
export { router as roomRouter };

export const roomSocketHandler = (io: any, socket: Socket) => {
  socket.on("room:join", joinRoom);
  socket.on("room:vote", individualVote);
  socket.on("room:startvoting", startVoting);
};
