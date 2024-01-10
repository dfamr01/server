//const OAuth = require('./auth.oauth.controller');

const {sendToken} = require('./auth.send-token.controller');
const {requireLogin} = require('./auth.require-login.controller');
const {requireActive} = require('./auth.require-active.controller');
const {hasPermissions} = require('./auth.has-permissions.controller');
const {login} = require('./auth.login.controller');
const {logout} = require('./auth.logout.controller');
const {register} = require('./auth.register.controller');
const {forgotPassword} = require('./auth.forgot-password.controller');
const {resetPassword} = require('./auth.reset-password.controller');
const {verifyEmail} = require('./auth.verify-email.controller');
const {optionalLogin} = require('./auth.optional-login.controller');
const {requestToken} = require('./auth.request-token.controller');
const {findAccessToken} = require('./auth.find-access-token.controller');

module.exports = {
  //OAuth,
  sendToken,
  requireLogin,
  requireActive,
  hasPermissions,
  login,
  logout,
  register,
  forgotPassword,
  resetPassword,
  verifyEmail,
  optionalLogin,
  requestToken,
  findAccessToken
};
