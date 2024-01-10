const passport = require('passport');
const logger = require('../../../config/log4js')('auth-require-permissions-ctrl');

exports.requirePermissions = async function requirePermissions(io, req, socket, user, paramsArray, cb) {
  logger.info('requirePermissions');// eslint-disable-line no-console
  // cb('requirePermissionsrequirePermissions');
};
