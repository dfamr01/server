const passport = require('passport');
const logger = require('../../../config/log4js')('chat-disconnected-ctrl');
const {leaveRoom} = require('./chat.leave-room.action');
const {leaveUsersRoom} = require("./chat.leave-users-room.action");

exports.chatSocketLogOut = function chatSocketLogOut(io, req, socket, user, paramsArray, cb) {
  socketLogOut(io, socket, user)
};

function socketLogOut(io, socket, user) {
  try {
    logger.info(`socketLogOut: socket ${socket?.id} user ${user?.id}`);

    if (socket.data && socket.data.roomsConnected) {
      for (const entry of Object.entries(socket.data.roomsConnected)) {
        const leaveSocketConnected = entry.key !== 'EVENT';
        if (entry.key === 'EVENT') {
          leaveUsersRoom(io, socket, user, null, ...entry)
        }
        leaveRoom(io, socket, user, null, ...entry, leaveSocketConnected);
      }
    }
    delete socket.user;
  } catch (err) {
    logger.error(`disconnect: error `, err);
  }
}
