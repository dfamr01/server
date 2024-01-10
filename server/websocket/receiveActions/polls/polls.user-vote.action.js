const path = require("path");
const logger = require('../../../config/log4js')(path.basename(__filename));

const {addPollOptionVote, getPoll} = require("../../chat/chatUtils/pollsDB");
const {canUserVote} = require("../../../shared/utils/polls.const");

exports.userVote = async function userVote(io, req, socket, user, paramsArray, cb) {
  await userVoteInner(io, socket, user, cb, ...paramsArray);
};

async function userVoteInner(io, socket, user, cb, room, data) {
  if (!data) {
    logger.error(`userVote: no data received socket ${socket?.id} user ${user} is started room id ${room} `);
    cb && cb({
      status: 'error',
      error: `missing data on ${room}`
    });
    return;
  }

  logger.info(`userVoteInner:start socket ${socket.id} send to ${room} `, data);

  try {
    if (!socket.data.roomsConnected || !socket.data.roomsConnected[room]) {
      cb && cb({
        status: 'error',
        error: 'you cant send vote to room you are not connected'
      });
      logger.error(`userVote: user ${user?.id} tried to create poll in a room that he is not connected ${room}`);
      return;
    }

    if (!user || !user.id) {
      throw new Error('only logged in users can vote');
    }

    const poll = await getPoll({PollId: data.PollId});

    const {status, timerInSec, publishedAt} = poll
    canUserVote({status, timerInSec, publishedAt})

    const res = await addPollOptionVote({
      UserId: user.id,
      PollId: data.PollId,
      PollOptionId: data.PollOptionId,
    });

    io.to(room).emit('route', 'polls', 'receiveVote', res.data);

    cb && cb({
      status: 'ok',
      data: res.data
    });
  } catch (err) {
    cb && cb({
      status: 'error',
      error: err.message || err
    });
    logger.error(`userVote: error  ${err.message || err}`);
  }

}
