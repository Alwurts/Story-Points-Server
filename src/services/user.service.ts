import { Request, Response } from "express";
import * as crypto from "crypto";
import { serverStorage } from "./storage.service";
import sessionService from "./session.service";
import { UserClient, User, UserSession } from "../types/user";
import roomService from "./room.service";
// functions to interact with postgres without the response and request, just pass the parameters we need

const getUserById = (id: string) => {
  return serverStorage.users[id];
};

const getUsers = () => {
  return serverStorage.users;
};

const createUser = (userName: string) => {
  let newUserId: string;
  newUserId = crypto.randomUUID();
  // Check we dont have that Id already
  while (!newUserId || serverStorage.users[newUserId]) {
    newUserId = crypto.randomUUID();
  }

  const newClientUser: UserClient = {
    id: newUserId,
    userName: userName,
  };
  const newServerUser: User = {
    ...newClientUser,
    active: false,
    sessions: {},
  };
  serverStorage.users[newUserId] = newServerUser;
  return newClientUser;
};

const setUserToActive = (userId: string) => {
  const oldUser = getUserById(userId);
  if (!oldUser) return null;
  oldUser.active = true;
  return oldUser;
};

const setUserToInactive = (userId: string) => {
  const oldUser = getUserById(userId);
  if (!oldUser) return null;
  oldUser.active = false;
  return oldUser;
};

const updateUserName = (userName: string, id: string) => {
  const oldUser = serverStorage.users[id];
  if (!oldUser) return null;
  const updateUser = { ...oldUser, userName: userName };
  serverStorage.users[id] = updateUser;
  return updateUser;
};

const deleteUser = (id: string) => {
  return delete serverStorage.users[id];
};

const addSessionToUser = (userId: string, roomId: string) => {
  const userToUpdate = getUserById(userId);
  if (!userToUpdate) return null;

  const newSession = sessionService.createSession(roomId, userId);
  userToUpdate.sessions[newSession.id] = newSession;
  setUserToActive(userId);
  return newSession;
};

const userHasSessionInRoom = (userId: string, roomId: string) => {
  return !!Object.values(getUserById(userId).sessions).filter((userSession) => {
    return userSession.roomId === roomId;
  }).length;
};

const deleteSessionFromUser = (userId: string, sessionId: string) => {
  const userToUpdate = getUserById(userId);
  if (!userToUpdate) return null;

  const deletedSession = sessionService.deleteSession(sessionId);
  if (!deletedSession) return null;

  delete userToUpdate.sessions[deletedSession.id];

  // Check if user has active sessions that match session.roomId
  // If no match then removeUserFromRoom
  if (!userHasSessionInRoom(deletedSession.userId, deletedSession.roomId)) {
    roomService.deleteUserFromRoom(userToUpdate.id, deletedSession.roomId);
  }

  if (!Object.keys(userToUpdate.sessions).length) {
    setUserToInactive(userToUpdate.id);
  }
  console.log(serverStorage.rooms[deletedSession.roomId]);
  return true;
};

export default {
  getUsers,
  getUserById,
  createUser,
  updateUserName,
  deleteUser,
  addSessionToUser,
  deleteSessionFromUser,
  setUserToActive,
  setUserToInactive,
};
