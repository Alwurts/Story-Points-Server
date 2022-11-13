import { Request, Response, NextFunction } from "express";
import roomService from "../services/room.service";
import userService from "../services/user.service";

const createRoom = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const { roomTopic, moderatorId } = request.body;
    if (!roomTopic) {
      const err: any = new Error("No roomTopic");
      err.statusCode = 400;
      return next(err);
    }
    const newRoom = roomService.createRoom(roomTopic, moderatorId);
    response.json(newRoom);
  } catch (error) {
    next(error);
  }
};

const validateRoom = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const { roomId } = request.body;
    if (!roomId) {
      const err: any = new Error("No roomId");
      err.statusCode = 400;
      return next(err);
    }
    const room = roomService.getRoomById(roomId);
    response.json(room);
  } catch (error) {
    next(error);
  }
};

const validateUserInRoom = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const { roomId, userSavedId } = request.body;
    if (!roomId) {
      const err: any = new Error("No roomId");
      err.statusCode = 400;
      return next(err);
    }
    const room = roomService.getRoomById(roomId);
    if (!room) {
      const err: any = new Error("Room does not exist");
      err.statusCode = 400;
      return next(err);
    }
    /* const userAlreadyInRoom = !!room.activeUsers.filter((user) => {
      return user.id === userSavedId;
    }).length; */

    const userAlreadyInRoom = roomService.validateUserActiveInRoom(
      userSavedId,
      room.id
    );

    response.json({
      currentlyActive: userAlreadyInRoom,
      hasBeenActive: !!room.hasBeenActiveUser[userSavedId],
    });
  } catch (error) {
    next(error);
  }
};

export default { createRoom, validateRoom, validateUserInRoom };
