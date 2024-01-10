const path = require('path');
const logger = require('../../../config/log4js')(path.basename(__filename));

const {deletePoll} = require("../../chat/chatUtils/pollsDB");

exports.deletePoll = async function deletePoll(io, req, socket, user, paramsArray, cb) {
  await deletePollInner(io, socket, user, cb, ...paramsArray);
};

async function deletePollInner(io, socket, user, cb, room, data) {
  if (!data) {
    logger.error(`deletePoll: no data received socket ${socket?.id} user ${user} is started room id ${room} `);
    cb && cb({
      status: 'error',
      error: `missing data on ${room}`
    });
    return;
  }

  logger.info(`deletePoll:start socket ${socket.id} in room ${room} `, data);

  try {
    if (!socket.data.roomsConnected || !socket.data.roomsConnected[room]) {
      cb && cb({
        status: 'error',
        error: 'you cant delete poll in a room you are not connected'
      });
      logger.error(`deletePoll: user ${user.id} tried to create poll in a room that he is not connected ${room}`);
      return;
    }

    io.to(room).emit('route', 'polls', 'pollDeleteMessage', {id: data.id});

    const _data = await deletePoll({
      UserId: user.id,
      PollId: data.id
    });

    logger.info(`deletePoll:success - socket ${socket.id} user.id ${user.id} deleted poll ${data.id}`);

    cb && cb({
      status: 'ok',
      data: _data
    });
  } catch (err) {
    cb && cb({
      status: 'error',
      error: err.message || err
    });
    logger.error(`deletePoll: error  ${err}`);
  }

}
