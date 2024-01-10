const SocketRouter = require('../shared/utils/SocketRouter');
let socketRouter = null;
module.exports = function (app) {
  socketRouter = new SocketRouter(app);
  require('../websocket/routes/auth.routes')(socketRouter);
  require('../websocket/routes/polls.routes')(socketRouter);
  require('../websocket/routes/chat.routes')(socketRouter);
  require('../websocket/routes/notification.routes')(socketRouter);

  return socketRouter;
};

exports.getRouter = function getRouter() {
  return socketRouter;
}

exports.getIo = function getIo() {
  return socketRouter.io;
}

