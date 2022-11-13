import { Server } from "http";
import { Socket } from "socket.io";
import { serverStorage } from "../services/storage.service";
import * as crypto from "crypto";
import { Room } from "../types/room";
import roomService from "../services/room.service";

export const joinRoom = function (this: Socket, payload: any) {
  console.log("JOIN ROOM");
  const { userId, roomId } = payload;
  const socket = this;
  if (roomService.getRoomById(roomId)) {
    const updatedRoom = roomService.addUserToRoom(userId, roomId);
    socket.join(roomId);

    socket.emit("room:update", serverStorage.rooms[roomId]);
  } else {
    // Return error
  }
};

export const individualVote = function (this: Socket, payload: any) {
  const { userId, roomId, vote } = payload;
  const socket = this;
  if (roomService.getRoomById(roomId)) {
    const updatedRoom = roomService.userIndividualVote(roomId, userId, vote);
    console.log("individualVote");
    console.log(updatedRoom);
    socket.emit("room:update", serverStorage.rooms[roomId]);
    //socket.emit("room:vote", serverStorage.rooms[roomId]);
  } else {
    // Return error
  }
};

export const startVoting = function (this: Socket, payload: any) {
  const { roomId } = payload;
  const socket = this;
  if (roomService.getRoomById(roomId)) {
    const updatedRoom = roomService.startVoting(roomId);
    console.log("updateRoom");
    console.log(updatedRoom);
    socket.emit("room:update", serverStorage.rooms[roomId]);
    //socket.emit("room:startvoting", serverStorage.rooms[roomId]);
  } else {
    // Return error
  }
};
