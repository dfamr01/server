const logger = require('../../../config/log4js')('polls-disconnected-ctrl');
const {leaveRoom} = require('./polls.leave-room.action');

exports.pollsSocketLogOut = function pollsSocketLogOut(io, req, socket, user, paramsArray, cb) {
  socketLogOut(io, socket, user)
};

function socketLogOut(io, socket, user) {
  try {
    logger.info(`socketLogOut: socket ${socket?.id} user ${user?.id}`);

    if (socket.data && socket.data.roomsConnected) {
      for (const entry of Object.entries(socket.data.roomsConnected)) {
        leaveRoom(io, socket, user, null, ...entry);
      }
    }
    delete socket.user;
  } catch (err) {
    logger.error(`disconnect: error `, err);
  }
}
