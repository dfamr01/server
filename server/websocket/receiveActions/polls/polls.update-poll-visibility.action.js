const path = require("path");
const logger = require('../../../config/log4js')(path.basename(__filename));

const {updatePoll, getPollWithPollOptionsAndVotes} = require("../../chat/chatUtils/pollsDB");
const {POLL_STATUS} = require("../../../shared/utils/polls.const");
const {getNowUTC} = require("../../../shared/utils/date.utils");

exports.updatePollVisibility = async function updatePollVisibility(io, req, socket, user, paramsArray, cb) {
  await updatePollVisibilityInner(io, socket, user, cb, ...paramsArray);
};

async function updatePollVisibilityInner(io, socket, user, cb, room, data) {
  if (!data) {
    logger.error(`updatePollVisibility: no data received socket ${socket?.id} user ${user} is started room id ${room} `);
    cb && cb({
      status: 'error',
      error: `missing data on ${room}`
    });
    return;
  }

  logger.info(`updatePollVisibilityInner:start socket ${socket.id} send to ${room} `, data);

  try {
    if (!socket.data.roomsConnected || !socket.data.roomsConnected[room]) {
      cb && cb({
        status: 'error',
        error: 'you cant update poll in a room you are not connected'
      });
      logger.error(`updatePollVisibility: user ${user.id} tried to update poll in a room that he is not connected ${room}`);
      return;
    }

    const {
      id,
      status
    } = data;

    const updatedPoll = {
      id,
      status,
      publishedAt: getNowUTC()
    }
    let {data: _data, updated} = await updatePoll({
      UserId: user.id,
      poll: updatedPoll,
    });

    logger.info(`updatePollVisibility: success - user ${user.id}  socket ${socket.id} send to ${room} `, _data);
    if (updated) {
      if (status === POLL_STATUS.PUBLISHED.key) {
        _data = await getPollWithPollOptionsAndVotes({PollId: id});
      }

      io.to(room).emit('route', 'polls', 'updatePollVisibilityMessage', _data);
    }

    cb && cb({
      status: 'ok',
      data: _data
    });
  } catch (err) {
    cb && cb({
      status: 'error',
      error: err.message || err
    });
    logger.error(`updatePollVisibility: error ${err.message || err}`);
  }

}
