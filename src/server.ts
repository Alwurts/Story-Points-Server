import express, { Request, Response, NextFunction } from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import { User } from "./types/user";
import { roomSocketHandler } from "./routes/room.routes";
import { serverStorage } from "./services/storage.service";
import { authRouter } from "./routes/auth.routes";
import { roomRouter } from "./routes/room.routes";
import roomService from "./services/room.service";
import userService from "./services/user.service";
import { SocketRoom } from "./types/socket";
import sessionService from "./services/session.service";

import * as dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json()); // Instead of body-parser.json
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;

const CLIENT_URL =
  process.env.CLIENT_URL || "https://www.storymator.alwurts.com";

const corsOptions = {
  origin: CLIENT_URL,
};
app.use(cors(corsOptions));

app.use((request: Request, response: Response, next: NextFunction) => {
  console.log(request.method, request.url);
  next();
});

app.use(authRouter);
app.use(roomRouter);

/* Error handler middleware */
app.use(
  (error: any, request: Request, response: Response, next: NextFunction) => {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.detail || error.message;
    console.error(`Error: `, errorMessage);
    response.status(statusCode).json(errorMessage);
    return;
  }
);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
  },
});

io.on("connection", (socket: SocketRoom) => {
  //console.log(`⚡: ${socket.id} user just connected!`);
  //roomSocketHandler(io, socket);

  socket.on("room:join", (data) => {
    const { userId, roomId } = data;

    if (!userId || !roomId) {
      socket.emit("room:redirect", "/");
      return;
    }

    const currentRoom = roomService.getRoomById(roomId);
    if (!currentRoom) {
      socket.emit("room:redirect", "/roomerror");
      return;
    }

    const currentUser = userService.getUserById(userId);
    if (!currentUser) {
      socket.emit("room:redirect", `/joinroom/${currentRoom.id}`);
      return;
    }

    const userIsActiveInRoom = roomService.validateUserActiveInRoom(
      userId,
      currentRoom.id
    );

    switch (currentRoom.state) {
      case "inactive":
        socket.emit("room:redirect", "/roomerror");
        return;
      case "waiting":
        break;
      case "voting":
        /* if (currentRoom.votingSessionVotes[userId] === undefined) {
          socket.emit("room:redirect", `/joinroom/${currentRoom.id}`);
          return;
        } */
        break;
      default:
        console.log("DEFAULT");
        break;
    }

    const userAddedToRoom = roomService.addUserToRoom(userId, roomId);
    if (!userAddedToRoom) return;

    const newSession = userService.addSessionToUser(userId, roomId);
    if (newSession) {
      socket.userId = newSession.userId;
      socket.sessionId = newSession.id;
      socket.join(newSession.roomId);
      io.sockets
        .in(newSession.roomId)
        .emit("room:update", serverStorage.rooms[roomId]);
    } else {
      socket.emit("room:redirect", "/roomerror");
    }
  });

  socket.on("room:startvoting", (data) => {
    const { roomId } = data;
    const currentRoom = roomService.getRoomById(roomId);
    if (currentRoom && currentRoom.state === "waiting") {
      const updatedRoom = roomService.startVoting(roomId);
      io.sockets.in(roomId).emit("room:update", serverStorage.rooms[roomId]);
    } else {
      return;
    }
  });

  socket.on("room:finishvoting", (data) => {
    const { roomId } = data;
    const currentRoom = roomService.getRoomById(roomId);

    if (currentRoom && currentRoom.state === "voting") {
      const updatedRoom = roomService.finishVoting(roomId);
      if (!updatedRoom) return;
      io.sockets.in(roomId).emit("room:update", serverStorage.rooms[roomId]);
    } else {
      return;
    }
  });

  socket.on("room:finishresults", (data) => {
    const { roomId } = data;
    const currentRoom = roomService.getRoomById(roomId);

    if (currentRoom && currentRoom.state === "results") {
      const updatedRoom = roomService.finishResults(roomId);
      if (!updatedRoom) return;
      io.sockets.in(roomId).emit("room:update", serverStorage.rooms[roomId]);
    } else {
      return;
    }
  });

  socket.on("room:vote", (data) => {
    const { userId, roomId, vote } = data;
    const currentRoom = roomService.getRoomById(roomId);
    if (currentRoom && currentRoom.state === "voting") {
      const updatedRoom = roomService.userIndividualVote(roomId, userId, vote);
      io.sockets.in(roomId).emit("room:update", serverStorage.rooms[roomId]);
    } else {
      return;
    }
  });

  socket.on("disconnect", (data) => {
    const { userId, sessionId } = socket;

    if (userId && sessionId) {
      console.log(`🔥: user disconnected`);
      const session = sessionService.getSessionById(sessionId);
      userService.deleteSessionFromUser(userId, sessionId);
      io.sockets
        .in(session.roomId)
        .emit("room:update", serverStorage.rooms[session.roomId]);
    }
  });
});

server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
