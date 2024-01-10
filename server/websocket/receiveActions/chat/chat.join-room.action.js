const logger = require('../../../config/log4js')('chat-join-room-ctrl');

const {
  getMessages,
  getUsersCount,
} = require('../../chat/chatUtils/chatManagment');
const {getUsersRoomId} = require("../../chat/chatUtils/chatHelpers");

exports.chatJoinRoom = async function chatJoinRoom(io, req, socket, user, paramsArray, cb) {
  await joinRoom(io, socket, user, cb, ...paramsArray)
};

async function joinRoom(io, socket, user, cb, room, data) {
  if (!data) {
    logger.error(`joinRoom: no data received socket ${socket?.id} user ${user} is started room id ${room} `);
    cb && cb({
      status: 'error',
      error: `missing data on ${room}`
    });
    return;
  }
  const {roomKey, userData} = data;
  const userId = user && user.id;
  logger.info(`joinRoom: socket ${socket?.id} user ${userId} is started joinRoom ${roomKey}, id ${room} `);

  try {
    if (room) {
      if (!socket.data.roomsConnected) {
        socket.data.roomsConnected = {};
      }

      //if not in the room already
      if (!socket.data.roomsConnected[room]) {
        logger.info(`joinRoom: socket ${socket?.id} is in room ${roomKey}, id ${room}`);
        socket.join(room);
        socket.data.roomsConnected[room] = {room, roomKey, userId};
      }

      if (userId) {
        socket.data.userData = userData;
        logger.info(`joinRoom: add user ${userId} to room ${roomKey}, id ${room}`, data);
        socket.data.userId = userId;
      }

      const messages = await getMessages({id: room});
      const usersCount = await getUsersCount(io, room);

      cb && cb({
        status: 'ok',
        data: {messages, usersCount}
      });
      const usersRoomId = getUsersRoomId(room);

      if (userId) { //only if a new valid user is added to the room notify the room
        io.to(usersRoomId).emit('route', 'chat', 'updateUsersRoom', {
          roomKey,
          room,
          usersRoomId,
          action: 'add',
          userId,
          userData: data.userData
        });

        io.to(room).emit('route', 'chat', 'updateUsersCount', {
          roomKey,
          room,
          usersCount: usersCount
        });
      }

    } else {
      cb && cb({
        status: 'error',
        error: `room ${roomKey} does not exist`
      });
      logger.error(`joinRoom: user ${userId} tried to enter none exiting ${roomKey} room, id ${room}`);
    }
  } catch (err) {
    cb && cb({
      status: 'error',
      error: err.message || err
    });
    logger.error(`joinRoom: exception ${err.message || err}`);
  }
}
