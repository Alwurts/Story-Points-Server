import { Server } from "http";
import { Socket } from "socket.io";
import { serverStorage } from "../services/storage.service";
import * as crypto from "crypto";
import { Room } from "../types/room";
import roomService from "../services/room.service";
import { SocketRoom } from "../types/socket";
import userService from "../services/user.service";
import sessionService from "../services/session.service";

export const joinRoom = function (io: any, socket: SocketRoom, data: any) {
  const { userId, roomId } = data;

  if (!userId || !roomId) {
    socket.emit("room:redirect", "/");
    return;
  }

  const currentRoom = roomService.getRoomById(roomId);
  if (!currentRoom) {
    socket.emit("room:redirect", `/roomerror?errorMessage=doesn't exist`);
    return;
  }

  if (currentRoom.activeUsers.length > 10) {
    socket.emit("room:redirect", `/roomerror?errorMessage=is full`);
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

  if (currentRoom.state === "inactive")
    socket.emit("room:redirect", "/roomerror");

  const userAddedToRoom = roomService.addUserToRoom(userId, roomId);
  if (!userAddedToRoom) return;

  const newSession = userService.addSessionToUser(userId, roomId);
  if (newSession) {
    socket.userId = newSession.userId;
    socket.sessionId = newSession.id;
    socket.roomId = newSession.roomId;
    socket.join(newSession.roomId);
    io.sockets
      .in(newSession.roomId)
      .emit("room:update", serverStorage.rooms[roomId]);
  } else {
    socket.emit("room:redirect", "/roomerror");
  }
};

export const startVoting = function (io: any, socket: SocketRoom, data: any) {
  const roomId = socket.roomId as string;
  const currentRoom = roomService.getRoomById(roomId);
  if (currentRoom && currentRoom.state === "waiting") {
    const updatedRoom = roomService.startVoting(roomId);
    io.sockets.in(roomId).emit("room:update", serverStorage.rooms[roomId]);
  } else {
    return;
  }
};

export const finishVoting = function (io: any, socket: SocketRoom, data: any) {
  const roomId = socket.roomId as string;
  const currentRoom = roomService.getRoomById(roomId);

  if (currentRoom && currentRoom.state === "voting") {
    const updatedRoom = roomService.finishVoting(roomId);
    if (!updatedRoom) return;
    io.sockets.in(roomId).emit("room:update", serverStorage.rooms[roomId]);
  } else {
    return;
  }
};

export const finishResults = function (io: any, socket: SocketRoom, data: any) {
  const roomId = socket.roomId as string;
  const currentRoom = roomService.getRoomById(roomId);

  if (currentRoom && currentRoom.state === "results") {
    const updatedRoom = roomService.finishResults(roomId);
    if (!updatedRoom) return;
    io.sockets.in(roomId).emit("room:update", serverStorage.rooms[roomId]);
  } else {
    return;
  }
};

export const vote = function (io: any, socket: SocketRoom, data: any) {
  const { vote } = data;
  const roomId = socket.roomId as string;
  const userId = socket.userId as string;
  const currentRoom = roomService.getRoomById(roomId);
  if (currentRoom && currentRoom.state === "voting") {
    const updatedRoom = roomService.userIndividualVote(roomId, userId, vote);
    io.sockets.in(roomId).emit("room:update", serverStorage.rooms[roomId]);
  } else {
    return;
  }
};

export const closeRoom = function (io: any, socket: SocketRoom, data: any) {
  const roomId = socket.roomId as string;
  const currentRoom = roomService.getRoomById(roomId);
  if (currentRoom) {
    roomService.deleteRoom(roomId);
    io.sockets
      .in(roomId)
      .emit("room:redirect", `/roomerror?errorMessage=was closed`);
  }
};

export const exitRoom = function (io: any, socket: SocketRoom, data: any) {
  const roomId = socket.roomId as string;
  const userId = socket.userId as string;
  const exitedRoom = roomService.deleteUserFromRoom(userId, roomId);
  if (exitedRoom) {
    socket.emit("room:redirect", `/roomerror?errorMessage=was exited`);
    io.sockets.in(roomId).emit("room:update", serverStorage.rooms[roomId]);
  }
};

export const disconnect = function (io: any, socket: SocketRoom, data: any) {
  const sessionId = socket.sessionId as string;
  const userId = socket.userId as string;

  if (userId && sessionId) {
    console.log(`🔥: user disconnected`);
    const session = sessionService.getSessionById(sessionId);
    userService.deleteSessionFromUser(userId, sessionId);
    io.sockets
      .in(session.roomId)
      .emit("room:update", serverStorage.rooms[session.roomId]);
  }
};
