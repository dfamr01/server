const logger = require('../../../config/log4js')('chat-leave-room-ctrl');

const {
  // removeUser,
  getUsersCount,
} = require('../../chat/chatUtils/chatManagment');
const {getUsersRoomId} = require("../../chat/chatUtils/chatHelpers");

exports.chatLeaveRoom = async function chatLeaveRoom(io, req, socket, user, paramsArray, cb) {
  await leaveRoom(io, socket, user, cb, ...paramsArray)
};

async function leaveRoom(io, socket, user, cb, room, data, leaveSocketConnected) {
  if (!data) {
    logger.error(`leaveRoom: no data received socket ${socket?.id} user ${user?.id} is started room id ${room} `);
    cb && cb({
      status: 'error',
      error: `missing data on ${room}`
    });
    return;
  }

  try {
    const userId = user && user.id;
    const roomKey = data.roomKey;
    logger.info(`leaveRoom: socket ${socket.id} user ${userId} is started leaveRoom id ${room}`);

    if (room) {
      if (userId) {
        // await removeUser({id: room, userId});
        logger.info(`leaveRoom: socket ${socket.id} user ${userId} is removed from db, room id ${room}`);
      }
    }
    if (!leaveSocketConnected) {
      socket.leave(room);
    }
    logger.info(`leaveRoom: socket ${socket.id} user ${userId} is disconnected from room id ${room}, leaveSocketConnected ${leaveSocketConnected}`,);

    if (socket.data.roomsConnected && socket.data.roomsConnected[room]) {
      delete socket.data.roomsConnected[room];
    }

    cb && cb({
      status: 'ok',
    });

    if (userId) {
      const usersRoomId = getUsersRoomId(room);

      io.to(usersRoomId).emit('route', 'chat', 'updateUsersRoom', {
        roomKey,
        room,
        usersRoomId,
        action: 'leave',
        userId,
      });

      const usersCount = await getUsersCount(io, room);
      logger.info(`leaveRoom:  socket ${socket.id} user ${userId} users count notify usersCount`, usersCount);

      io.to(room).emit('route', 'chat', 'updateUsersCount', {
        roomKey,
        room,
        usersCount: usersCount
      });
    }
  } catch (err) {
    cb && cb({
      status: 'error',
      error: err.message || err
    });
    logger.error(`leaveRoom: exception in room ${room} `, err.message);
  }
}

exports.leaveRoom = leaveRoom;