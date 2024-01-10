//const logger = require('../config/log4js')('auth router');

const {
  requirePermissions
} = require('../receiveActions/authentication');


module.exports = function (socketRouter) {
  socketRouter.use('notification:newEvent', requirePermissions, {})
};
