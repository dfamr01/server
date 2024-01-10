const logger = require('../../../config/log4js')('polls.update-room-poll-visibility.action');

const {
  addMessage,
} = require('../../chat/chatUtils/chatManagment');

exports.chatSendRoomMessage = function chatSendRoomMessage(io, req, socket, user, paramsArray, cb) {
  // console.log(' addMessage io', io);
  // console.log('req', req);
  // console.log('socket', socket);
  // console.log('chatSendRoomMessage', user);
  //console.log('chatSendRoomMessage paramsArray', paramsArray);
  //console.log('cb', cb);
  sendRoomMessage(io, socket, user, cb, ...paramsArray)

};

function sendRoomMessage(io, socket, user, cb, room, data) {
  if (!data) {
    logger.error(`sendRoomMessage: no data received socket ${socket?.id} user ${user} is started room id ${room} `);
    cb && cb({
      status: 'error',
      error: `missing data on ${room}`
    });
    return;
  }

  logger.info(`sendRoomMessage:start socket ${socket.id} send to ${room} `, data);

  try {
    if (!socket.data.roomsConnected || !socket.data.roomsConnected[room]) {
      cb && cb({
        status: 'error',
        error: 'you cant send messages to room you are not connected'
      });
      logger.error(`sendRoomMessage: user tried to send message to a room is not connected ${room}`);
      return;
    }

    const {authorId} = data;
    const _data = addMessage({id: room, message: data, authorId});

    logger.info(`sendRoomMessage:success - socket ${socket.id} send to ${room} `, data);

    socket.to(room).emit('route', 'chat', 'receiveMessage', _data);

    cb && cb({
      status: 'ok'
    });
  } catch (err) {
    cb && cb({
      status: 'error',
      error: err.message || err
    });
    logger.error(`sendRoomMessage: error  ${err}`);
  }

}
