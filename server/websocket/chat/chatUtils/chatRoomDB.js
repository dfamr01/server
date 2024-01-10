const {isEmpty} = require("lodash");
const {ChatRoom, RoomMessage} = require("../../../shared/database/models");
const {MAX_MESSAGES_IN_ROOM} = require("./chat.const");
const logger = require('../../../config/log4js')('chatRoomDB');

async function addMessage(roomId, UserId, message) {
  await RoomMessage.create({
    receiverId: roomId,
    UserId,
    data: message
  });
}

async function getAdmin(roomId) {
  const {UserId} = await ChatRoom.findByPk(roomId) || {};

  return UserId;
}

async function getMessages(roomId) {

  const messages = await RoomMessage.findAll({
    attributes: RoomMessage.getAllowedFieldsByKey('get'),
    where: {
      receiverId: roomId
    },
    order: [['createdAt', 'ASC']],
    limit: MAX_MESSAGES_IN_ROOM
  }) || [];

  return messages
}

async function getUsers(roomId) {
  const {users = {}} = await ChatRoom.findByPk(roomId) || {};
  return users;
}

async function addUser(roomId, userId, user) {
  const room = await ChatRoom.findByPk(roomId) || {};
  if (isEmpty(room)) {
    throw new Error('room does not exit');
  }

  if (user) {
    const usersDB = {...room.users};
    const {userData = {}} = user || {};
    usersDB[userId] = userData;
    room.users = usersDB;
    await room.save();
  }
}

async function getUser(roomId, userId) {
  const {users = {}} = await ChatRoom.findByPk(roomId) || {};
  return users[userId];
}

//
// async function removeUser(roomId, userId) {
//   const room = await ChatRoom.findByPk(roomId) || {};
//   if (isEmpty(room)) {
//     throw new Error('room does not exit');
//   }
//
//   const user = room.users[userId];
//   if (user) {
//     const usersDB = {...room.users}
//     delete usersDB[userId];
//     room.users = usersDB;
//     await room.save();
//   }
// }

async function deleteChatRoom(roomId) {
  logger.info(`deleteChatRoom: roomId:${roomId} `);

  await ChatRoom.destroy({
    where: {
      roomId
    }
  });
}

async function createChatRoom({
                                roomId,
                                roomKey,
                                UserId,
                                EventId,
                                OccurrenceId,
                              }) {
  logger.info(`chatRoomDB: [createChatRoom] roomId:${roomId} roomKey: ${roomKey} UserId: ${UserId}, EventId: ${EventId} OccurrenceId: ${OccurrenceId}`);

  const room = await ChatRoom.create({
    roomId,
    roomKey,
    UserId,
    EventId,
    OccurrenceId,
  });

  return room;
}

module.exports.addMessage = addMessage;
module.exports.getMessages = getMessages;
module.exports.getAdmin = getAdmin;
module.exports.getUsers = getUsers;
module.exports.getUser = getUser;
module.exports.addUser = addUser;
// module.exports.removeUser = removeUser;
module.exports.createChatRoom = createChatRoom;
module.exports.deleteChatRoom = deleteChatRoom;