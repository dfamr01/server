const logger = require('../../../config/log4js')('polls-leave-room-ctrl');

// const {
//   removeUser,
// } = require('../../chat/chatUtils/pollsManagment');

exports.pollsLeaveRoom = function pollsLeaveRoom(io, req, socket, user, paramsArray, cb) {
  leaveRoom(io, socket, user, cb, ...paramsArray)
};

function leaveRoom(io, socket, user, cb, room, data) {
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
    logger.info(`leaveRoom: socket ${socket.id} user ${userId} is started leaveRoom id ${room}`);

    if (room) {
      if (userId) {
        // removeUser({id: room, userId});
        logger.info(`leaveRoom:  socket ${socket.id} user ${userId} is removed from db, room id ${room}`);
      }
    }
    // if (!leaveSocketConnected) {
    //   socket.leave(room);
    // }
    socket.leave(room);

    logger.info(`leaveRoom:  socket ${socket.id} user ${userId} is disconnected from room id ${room}, leaveSocketConnected ${leaveSocketConnected}`,);

    delete socket?.data?.roomsConnected[room];

    cb && cb({
      status: 'ok',
    });

  } catch (err) {
    cb && cb({
      status: 'error',
      error: err.message || err
    });
    logger.error(`leaveRoom: user tried to enter none exiting room, id ${room}`);
  }
}

exports.leaveRoom = leaveRoom;