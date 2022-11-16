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
  roomSocketHandler(io, socket);
});

server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
