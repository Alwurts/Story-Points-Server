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

const app = express();
app.use(express.json()); // Instead of body-parser.json
const server = http.createServer(app);

console.log(serverStorage);

const corsOptions = {
  origin: "http://localhost:3000",
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
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket: SocketRoom) => {
  //console.log(`⚡: ${socket.id} user just connected!`);
  //roomSocketHandler(io, socket);

  socket.on("room:join", (data) => {
    console.log("JOIN ROOM");
    console.log(socket.sessionId);
    const { userId, roomId } = data;

    if (!userId || !roomId) return null;

    if (!roomService.getRoomById(roomId)) {
      return null;
    }

    const updatedRoom = roomService.addUserToRoom(userId, roomId);
    if (!updatedRoom) {
      socket.emit("room:update", null);
      return;
    }

    const newSession = userService.addSessionToUser(userId, roomId);

    if (newSession) {
      socket.userId = newSession.userId;
      socket.sessionId = newSession.id;
      socket.join(newSession.roomId);
      io.sockets
        .in(newSession.roomId)
        .emit("room:update", serverStorage.rooms[roomId]);
    } else {
      socket.emit("room:update", null);
    }
  });

  socket.on("disconnect", (sdata) => {
    console.log(`🔥: user disconnected`);

    const { userId, sessionId } = socket;

    if (userId && sessionId) {
      const session = sessionService.getSessionById(sessionId);
      userService.deleteSessionFromUser(userId, sessionId);
      io.sockets
        .in(session.roomId)
        .emit("room:update", serverStorage.rooms[session.roomId]);
    }
  });
});

server.listen(4000, () => {
  console.log("listening on *:4000");
});
