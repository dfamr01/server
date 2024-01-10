const {pollsJoinRoom} = require('./polls.join-room.action');
const {createNewPoll} = require("./polls.create-poll.action");
const {deletePoll} = require("./polls.delete-poll.action");
const {updatePollVisibility} = require("./polls.update-poll-visibility.action");
const {userVote} = require("./polls.user-vote.action");
const {pollsLeaveRoom} = require("./polls.leave-room.action");
const {pollsSocketDisconnected} = require("./polls.socket-disconnected.action");

module.exports = {
  pollsJoinRoom,
  createNewPoll,
  deletePoll,
  updatePollVisibility,
  userVote,
  pollsLeaveRoom,
  pollsSocketDisconnected
};
