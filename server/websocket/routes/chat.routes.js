//const logger = require('../config/log4js')('auth router');

const {
  requirePermissions
} = require('../receiveActions/authentication');

const {
  chatSendRoomMessage,
  chatJoinRoom,
  chatJoinUsersRoom,
  chatLeaveUsersRoom,
  chatLeaveRoom,
  chatSocketDisconnected
} = require('../receiveActions/chat');
const {chatSocketLogOut} = require("../receiveActions/chat/chat.socket-logOut.action");

module.exports = function (socketRouter) {
  socketRouter.use('chat:sendRoomMessage', requirePermissions, chatSendRoomMessage);
  socketRouter.use('chat:joinRoom', requirePermissions, chatJoinRoom);
  socketRouter.use('chat:leaveRoom', requirePermissions, chatLeaveRoom);
  socketRouter.use('chat:joinUsersRoom', requirePermissions, chatJoinUsersRoom);
  socketRouter.use('chat:leaveUsersRoom', requirePermissions, chatLeaveUsersRoom);
  socketRouter.use('chat:socketLogOut', requirePermissions, chatSocketLogOut);
  socketRouter.use('all:disconnect', requirePermissions, chatSocketDisconnected)
};
