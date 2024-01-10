const path = require("path");
const logger = require('../../../config/log4js')(path.basename(__filename));

const {createPoll} = require("../../chat/chatUtils/pollsDB");

exports.createNewPoll = async function createNewPoll(io, req, socket, user, paramsArray, cb) {
  await createNewPollInner(io, socket, user, cb, ...paramsArray);
};

async function createNewPollInner(io, socket, user, cb, room, data) {
  if (!data) {
    logger.error(`createNewPoll: no data received socket ${socket?.id} user ${user} is started room id ${room} `);
    cb && cb({
      status: 'error',
      error: `missing data on ${room}`
    });
    return;
  }

  logger.info(`createNewPoll:start socket ${socket.id} send to ${room} `, data);

  try {

    if (!socket.data.roomsConnected || !socket.data.roomsConnected[room]) {
      cb && cb({
        status: 'error',
        error: 'you cant create poll in a room you are not connected'
      });
      logger.error(`createNewPoll: user ${user.id} tried to create poll in a room that he is not connected ${room}`);
      return;
    }

    const _data = await createPoll({
      UserId: user.id,
      poll: data
    });

    logger.info(`createNewPoll:success - socket ${socket.id} send to ${room} `, data);

    cb && cb({
      status: 'ok',
      data: _data
    });
  } catch (err) {
    cb && cb({
      status: 'error',
      error: err.message || err
    });
    logger.error(`createNewPoll: error  ${err}`);
  }

}
