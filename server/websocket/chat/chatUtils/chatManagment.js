const {getNowUTC} = require('../../../shared/utils/date.utils');
const logger = require('../../../config/log4js')('ChatManagement');
const chatRoomDB = require("./chatRoomDB");

async function createRoom({
                            id,
                            roomKey,
                            userId,
                            EventId,
                            OccurrenceId,
                          }) {
  logger.info(`createRoom: create room ${id} started ${userId}`);

  if (!id || !roomKey || !userId) {
    logger.error(`createRoom: ${(!id ? 'room id' : '') + (!roomKey ? 'roomKey' : '') + (!userId ? 'userId' : '')} is not valid `);
    throw new Error('error data is missing ');
  }

  logger.info(`createRoom: preform action on room ${id} userId ${userId}`);
  try {
    await chatRoomDB.createChatRoom({
      roomId: id,
      UserId: userId,
      roomKey,
      EventId,
      OccurrenceId,
    });
    logger.info(`createRoom: room created ${id}`);

  } catch (err) {
    logger.error(`createRoom: exception ${id} `, err);
  }


  return true;
}

async function deleteRoom({id, userId}) {
  if (!id || !userId) {
    logger.error(`deleteRoom: ${(!id ? 'room id' : '') + (!userId ? 'userId' : '')} is not valid `);
    throw new Error('cant delete room data is missing ');
  }

  logger.info(`deleteRoom: 'room id' ${id} userId ${userId}`);

  await chatRoomDB.deleteChatRoom(id);
}

function addMessage({id, UserId, message}) {
  if (!id || !message) {
    logger.error(`addMessage: ${(!id ? 'room id' : '') + (!message ? 'message' : '')} is not valid `);
    throw new Error('error data is not valid');
  }
  logger.info(`addMessage: 'room id' ${id} `);

  const dateNow = getNowUTC();
  const _message = {
    ...message,
    time: dateNow.toISOString(),
  }
  chatRoomDB.addMessage(id, UserId, _message);
  return _message;
}

async function getMessages({id}) {
  if (!id) {
    logger.error(`getMessages: ${(!id ? 'room id' : '')} is not valid `);
    throw new Error('error data is not valid');
  }

  logger.info(`getMessages: room id ${id}`);
  const messages = await chatRoomDB.getMessages(id);
  logger.info(`getMessages: 'room id' ${id} result`, messages.length);

  return messages;
}

// async function removeUser({id, userId}) {
//   if (!id || !userId) {
//     logger.error(`removeUser: user data is missing 'room id' ${id} userId ${userId}`);
//     throw new Error('user data is missing ');
//   }
//
//   logger.info(`removeUser: room id ${id} userId ${userId}`);
//
//   await chatRoomDB.removeUser(id, userId);
// }

async function addUser({id, userId, data}) {
  if (!id || !userId || !data) {
    logger.error(`addUser: ${(!id ? 'room' : '') + (!userId ? 'userId' : '') + (!data ? 'data' : '')} is not valid `);
    throw new Error('user data is missing ');
  }

  logger.info(`addUser: 'room id' ${id} userId ${userId}`);

  await chatRoomDB.addUser(id, userId, data)
}

function getUserMap(io, roomId) {

}

async function getUsers(io, roomId) {
  if (!roomId) {
    logger.error('getUsers: room id is not valid ', roomId);
    throw new Error('room id is not valid ' + roomId);
  }

  logger.info(`getUsers: 'room id' ${roomId}`);
  const sockets = await io.in(roomId).fetchSockets() || [];
  const usersMap = new Map();
  for (const it of sockets) {
    if (it.data?.userId) {
      usersMap.set(it.data.userId, it.data.userData);
    }
  }
  logger.info(`getUsers: 'room id' ${roomId} result`, sockets.length);

  return Array.from(usersMap.values());
}

//
// async function getUser({id, userId}) {
//   if (!id || !userId) {
//     logger.error(`getUser: ${!id ? 'room ' : 'user'} id is not valid `);
//     throw new Error(`${!id ? 'room ' : 'user'} id is not valid `);
//   }
//
//   logger.info(`getUser: 'room id' ${id}`);
//   const user = await chatRoomDB.getUser(id, userId);
//   logger.info(`getUser: 'room id' ${id} result`, user);
//
//   return user;
// }

// function isUserInRoom({id, userId}) {
//   return !!getUser({id, userId});
// }

async function getUsersCount(io, roomId) {
  if (!roomId) {
    logger.error('getUsersCount: room id is not valid');
    throw new Error(`cant get users count`);
  }
  const sockets = await io.in(roomId).fetchSockets() || [];
  const usersMap = new Map();
  for (const it of sockets) {
    if (it.data?.userId) {
      usersMap.set(it.data.userId, it.data.userData);
    }
  }

  return usersMap.size;
}

module.exports.createRoom = createRoom;
module.exports.deleteRoom = deleteRoom;
module.exports.addMessage = addMessage;
module.exports.getMessages = getMessages;
// module.exports.removeUser = removeUser;
module.exports.addUser = addUser;
module.exports.getUsers = getUsers;
// module.exports.getUser = getUser;
// module.exports.isUserInRoom = isUserInRoom;
module.exports.getUsersCount = getUsersCount;