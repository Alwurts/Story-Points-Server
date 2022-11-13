import { Request, Response } from "express";
import * as crypto from "crypto";
import { serverStorage } from "./storage.service";
import { UserClient, User, UserSession } from "../types/user";
// functions to interact with postgres without the response and request, just pass the parameters we need

const getSessionById = (id: string) => {
  return serverStorage.sessions[id];
};

const getSessions = () => {
  return serverStorage.sessions;
};

const createSession = (roomId: string, userId: string) => {
  let newSessionId: string;
  newSessionId = crypto.randomUUID();
  while (!newSessionId || getSessionById(newSessionId)) {
    newSessionId = crypto.randomUUID();
  }

  const newSession: UserSession = {
    id: newSessionId,
    roomId: roomId,
    userId: userId,
    createAt: new Date(),
  };

  serverStorage.sessions[newSession.id] = newSession;

  return newSession;
};

const deleteSession = (sessionId: string) => {
  const session = serverStorage.sessions[sessionId];
  if (session) {
    delete serverStorage.sessions[sessionId];
  }

  return session;
};

export default {
  getSessions,
  getSessionById,
  createSession,
  deleteSession,
};
