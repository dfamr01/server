const logger = require('../../../config/log4js')('chat-join-users-room-ctrl');

const {
  getUsers,
} = require('../../chat/chatUtils/chatManagment');
const {getUsersRoomId} = require("../../chat/chatUtils/chatHelpers");

exports.chatJoinUsersRoom = async function chatJoinUsersRoom(io, req, socket, user, paramsArray, cb) {
  await joinUsersRoom(io, socket, user, cb, ...paramsArray)
};

async function joinUsersRoom(io, socket, user, cb, room, data) {
  if (!data) {
    logger.error(`joinUsersRoom: no data received socket ${socket?.id} user ${user} is started room id ${room} `);
    cb && cb({
      status: 'error',
      error: `no data received for fetching users`
    });
    return;
  }

  const {roomKey} = data;
  // const {roomKey, userId} = data;
  const userId = user && user.id;
  try {
    if (room) {
      if (!socket.data.roomsConnected) {
        socket.data.roomsConnected = {};
      }

      const usersRoomId = getUsersRoomId(room);
      if (!socket.data.roomsConnected[usersRoomId]) {
        socket.join(usersRoomId);
        socket.data.roomsConnected[usersRoomId] = {room: usersRoomId, roomKey, userId};
      }

      const usersInRoom = await getUsers(io, room);
      cb && cb({
        status: 'ok',
        data: {usersRoomId, usersInRoom}
      });

    } else {
      cb && cb({
        status: 'error',
        error: `room ${roomKey} does not exist`
      });
      logger.error(`join_users_room: user ${userId} tried to enter none exiting ${roomKey} room, id ${room}`);
    }
  } catch (err) {
    cb && cb({
      status: 'error',
      error: err.message || err
    });
    logger.error(`join_users_room: user ${userId} tried to enter none exiting ${roomKey} room, id ${room}`);
  }

}