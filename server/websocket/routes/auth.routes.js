//const logger = require('../config/log4js')('auth router');

const {
  jwtLogin
} = require('../receiveActions/authentication');

module.exports = function (socketRouter) {
  socketRouter.use('auth:jwtLogin', jwtLogin);
};
