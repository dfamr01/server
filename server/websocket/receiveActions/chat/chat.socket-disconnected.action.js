const passport = require('passport');
const logger = require('../../../config/log4js')('chat-disconnected-ctrl');
const {leaveRoom} = require('./chat.leave-room.action');

exports.chatSocketDisconnected = function chatSocketDisconnected(io, req, socket, user, paramsArray, cb) {
  socketDisconnected(io, socket, user)
};

function socketDisconnected(io, socket, user) {
  try {
    logger.info(`disconnect: socket ${socket?.id} user ${user?.id}`);

    if (socket.data && socket.data.roomsConnected) {
      for (const entry of Object.entries(socket.data.roomsConnected)) {
        leaveRoom(io, socket, user, null, ...entry);
      }
    }
  } catch (err) {
    logger.error(`disconnect: error `, err);
  }
}
