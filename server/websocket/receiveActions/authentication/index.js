const {jwtLogin} = require('./auth.jwt-login.action');
const {requirePermissions} = require('./auth.require-permissions.action');

module.exports = {
  jwtLogin,
  requirePermissions
};
