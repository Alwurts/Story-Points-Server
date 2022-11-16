import * as crypto from "crypto";
import { serverStorage } from "./storage.service";
import userService from "./user.service";
import { Room } from "../types/room";
// functions to interact with postgres without the response and request, just pass the parameters we need

const getRoomById = (id: string) => {
  return serverStorage.rooms[id];
};

const getRooms = () => {
  return serverStorage.rooms;
};

const createRoom = (roomTopic: string, moderatorId: string) => {
  let newRoomId: string;
  newRoomId = crypto.randomUUID();
  while (!newRoomId || serverStorage.rooms[newRoomId]) {
    newRoomId = crypto.randomUUID();
  }
  const newRoom: Room = {
    id: newRoomId,
    topic: roomTopic,
    state: "waiting",
    moderator: moderatorId ? serverStorage.users[moderatorId] : null,
    activeUsers: [],
    hasBeenActiveUser: {},
    votingSessionVotes: {},
  };
  serverStorage.rooms[newRoomId] = newRoom;
  return newRoom;
};

const deleteRoom = (id: string) => {
  return delete serverStorage.rooms[id];
};

const startVoting = (roomId: string) => {
  const roomToVoteOn = serverStorage.rooms[roomId];
  if (!roomToVoteOn) return null;
  roomToVoteOn.state = "voting";
  roomToVoteOn.activeUsers.forEach((user) => {
    roomToVoteOn.votingSessionVotes[user.id] = null;
  });
  return roomToVoteOn;
};

const finishVoting = (roomId: string) => {
  const roomToVoteOn = serverStorage.rooms[roomId];
  if (!roomToVoteOn) return null;

  const allActiveUsersVoted =
    -1 ===
    Object.keys(roomToVoteOn.votingSessionVotes).findIndex((votingUserId) => {
      const votingUserIsActive =
        -1 !==
        roomToVoteOn.activeUsers.findIndex(
          (activeUser) => activeUser.id === votingUserId
        );
      if (votingUserIsActive) {
        return roomToVoteOn.votingSessionVotes[votingUserId] === null;
      }
    });

  if (!allActiveUsersVoted) return;

  roomToVoteOn.state = "results";
  return roomToVoteOn;
};

const finishResults = (roomId: string) => {
  const roomToVoteOn = serverStorage.rooms[roomId];
  if (!roomToVoteOn) return null;

  roomToVoteOn.state = "waiting";
  roomToVoteOn.votingSessionVotes = {};
  return roomToVoteOn;
};

const addModeratorToRoom = (userId: string, roomId: string) => {
  const moderator = serverStorage.users[userId];
  if (!moderator) return null;

  const room = serverStorage.rooms[roomId];
  if (!room) return null;

  serverStorage.rooms[roomId].moderator = moderator;
  return room;
};

const addUserToRoom = (userId: string, roomId: string) => {
  if (!roomId || !userId) return null;

  const newRoomUser = serverStorage.users[userId];
  if (!newRoomUser) return null;

  const room = serverStorage.rooms[roomId];
  if (!room) return null;

  if (room.activeUsers.length >= 10) return null;

  const roomHaveBeenActiveUsers = room.hasBeenActiveUser;
  if (!roomHaveBeenActiveUsers[newRoomUser.id]) {
    roomHaveBeenActiveUsers[newRoomUser.id] = newRoomUser;
  }

  const userIsActiveAlready = validateUserActiveInRoom(userId, roomId);
  if (!userIsActiveAlready) {
    room.activeUsers.push(newRoomUser);
  }

  if (!room.moderator) {
    addModeratorToRoom(newRoomUser.id, room.id);
  }
  return newRoomUser;
};

const addUserToHasBeenActiveRoom = (userId: string, roomId: string) => {
  if (!roomId || !userId) return null;

  const newRoomUser = serverStorage.users[userId];
  if (!newRoomUser) return null;

  const room = serverStorage.rooms[roomId];
  if (!room) return null;

  const roomHaveBeenActiveUsers = room.hasBeenActiveUser;
  if (!roomHaveBeenActiveUsers[newRoomUser.id]) {
    roomHaveBeenActiveUsers[newRoomUser.id] = newRoomUser;
  }

  return newRoomUser;
};

const validateUserActiveInRoom = (userId: string, roomId: string) => {
  return !!getRoomById(roomId).activeUsers.filter((user) => {
    return user.id === userId;
  }).length;
};

const userIndividualVote = (roomId: string, userId: string, vote: string) => {
  const userVoting = serverStorage.users[userId];
  if (!userVoting) return null;

  const roomToVoteOn = serverStorage.rooms[roomId];
  if (!roomToVoteOn) return null;

  roomToVoteOn.votingSessionVotes[userId] = vote;
  return roomToVoteOn;
};

const deleteUserFromRoom = (userId: string, roomId: string) => {
  const newRoomUser = serverStorage.users[userId];
  if (!newRoomUser) return null;

  const room = serverStorage.rooms[roomId];
  if (!room) return null;

  const roomActiveUsers = room.activeUsers;
  const userInRoomPosition = roomActiveUsers.findIndex((userActive) => {
    return userActive.id === userId;
  });

  if (userInRoomPosition != -1) {
    serverStorage.rooms[roomId].activeUsers = roomActiveUsers.splice(
      userInRoomPosition - 1,
      1
    );
  }
  if (userInRoomPosition === 0 && roomActiveUsers.length) {
    addModeratorToRoom(roomActiveUsers[0].id, roomId);
  }
  if (roomActiveUsers.length === 0) {
    /* setRoomToInactive(roomId);
    removeModerator(roomId); */
    deleteRoom(roomId);
    return true;
  }
  return serverStorage.rooms[roomId];
};

const removeModerator = (roomId: string) =>
  (serverStorage.rooms[roomId].moderator = null);

const setRoomToInactive = (roomId: string) =>
  (serverStorage.rooms[roomId].state = "inactive");

export default {
  addUserToRoom,
  deleteUserFromRoom,
  addModeratorToRoom,
  userIndividualVote,
  validateUserActiveInRoom,
  addUserToHasBeenActiveRoom,
  getRooms,
  startVoting,
  finishVoting,
  finishResults,
  createRoom,
  getRoomById,
  deleteRoom,
};
