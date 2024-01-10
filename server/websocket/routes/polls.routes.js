const {
  requirePermissions
} = require('../receiveActions/authentication');

const {
  deletePoll,
  updatePollVisibility,
  pollsJoinRoom,
  createNewPoll,
  userVote,
  pollsLeaveRoom,
  pollsSocketDisconnected
} = require('../receiveActions/polls');


module.exports = function (socketRouter) {
  socketRouter.use('polls:joinRoom', requirePermissions, pollsJoinRoom);
  socketRouter.use('polls:createPoll', requirePermissions, createNewPoll);
  socketRouter.use('polls:deletePoll', requirePermissions, deletePoll);
  socketRouter.use('polls:updatePollVisibility', requirePermissions, updatePollVisibility);
  socketRouter.use('polls:userVote', requirePermissions, userVote);
  socketRouter.use('polls:leaveRoom', requirePermissions, pollsLeaveRoom);
  socketRouter.use('polls:socketLogOut', requirePermissions, pollsSocketDisconnected);
};
