const logger = require('../../../config/log4js')('chat-leave-users-room-ctrl');
const {
  isRoomExist,
} = require('../../chat/chatUtils/chatManagment');
const {getUsersRoomId} = require("../../chat/chatUtils/chatHelpers");


exports.chatLeaveUsersRoom = function chatLeaveUsersRoom(io, req, socket, user, paramsArray, cb) {
  leaveUsersRoom(io, socket, user, cb, ...paramsArray)
};

function leaveUsersRoom(io, socket, user, cb, room, data) {
  if (!data) {
    logger.error(`leaveUsersRoom: no data received socket ${socket?.id} user ${user} is started room id ${room} `);
    cb && cb({
      status: 'error',
      error: `missing data on ${room}`
    });
    return;
  }

  const {roomKey} = data;
  try {
    if (room) {
      const usersRoomId = getUsersRoomId(room);

      if (usersRoomId && socket.data.roomsConnected && socket.data.roomsConnected[usersRoomId]) {
        socket.leave(usersRoomId);
        delete socket.data.roomsConnected[usersRoomId];
      }

      cb && cb({
        status: 'ok',
      });

    } else {
      cb && cb({
        status: 'error',
        error: `room ${roomKey} does not exist`
      });
      logger.error(`leaveUsersRoom: user tried to leave_room none exiting ${roomKey} room, id ${room}`);
    }
  } catch (err) {
    cb && cb({
      status: 'error',
      error: err.message || err
    });
    logger.error(`leaveUsersRoom: ${err}`);
  }

}

exports.leaveUsersRoom = leaveUsersRoom;