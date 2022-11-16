import express from "express";
import { Socket } from "socket.io";
import { SocketRoom } from "../types/socket";
import room from "../controllers/room.controller";
import {
  closeRoom,
  disconnect,
  exitRoom,
  finishResults,
  finishVoting,
  joinRoom,
  startVoting,
  vote,
} from "../controllers/room.socket.controller";

const router = express.Router();

router.post("/api/room/createroom", room.createRoom);
router.post("/api/room/validateroom", room.validateRoom);
router.post("/api/room/validateuserinroom", room.validateUserInRoom);
export { router as roomRouter };

export const roomSocketHandler = (io: any, socket: SocketRoom) => {
  socket.on("room:join", (data: any) => joinRoom(io, socket, data));
  socket.on("room:startvoting", (data: any) => startVoting(io, socket, data));
  socket.on("room:finishvoting", (data: any) => finishVoting(io, socket, data));
  socket.on("room:finishresults", (data: any) =>
    finishResults(io, socket, data)
  );
  socket.on("room:vote", (data: any) => vote(io, socket, data));
  socket.on("room:close", (data: any) => closeRoom(io, socket, data));
  socket.on("room:exit", (data: any) => exitRoom(io, socket, data));
  socket.on("room:disconnect", (data: any) => disconnect(io, socket, data));
};
