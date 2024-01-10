const logger = require('../../../config/log4js')('polls-join-room-ctrl');

const {getPolls, getAdminId} = require("../../chat/chatUtils/pollsDB");

exports.pollsJoinRoom = async function pollsJoinRoom(io, req, socket, user, paramsArray, cb) {
  await pollsRoom(io, socket, user, cb, ...paramsArray)
};

async function pollsRoom(io, socket, user, cb, room, data) {
  if (!data) {
    logger.error(`joinRoom: no data received socket ${socket?.id} user ${user} is started room id ${room} `);
    cb && cb({
      status: 'error',
      error: `missing data on ${room}`
    });
    return;
  }
  const {roomKey} = data;

  const userId = user && user.id;
  logger.info(`pollsJoinRoom: socket ${socket?.id} user ${userId} is started joinRoom, id ${room} `);

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
        logger.info(`joinRoom: add user ${userId} to room ${roomKey}, id ${room}`, data);
        socket.data.userId = userId;
      }

      const adminId = await getAdminId(room);
      const polls = await getPolls({
        ...data,
        UserId: adminId,
        isOwner: (+adminId === +userId)
      });

      cb && cb({
        status: 'ok',
        data: {polls}
      });

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
