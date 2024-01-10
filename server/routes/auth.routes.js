//const logger = require('../config/log4js')('auth router');

const {
  register,
  login,
  logout,
  requestToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  findAccessToken,
  sendToken
} = require('../controllers/authentication');

module.exports = function (apiRouter) {

  // Sign Up
  // ==================================================
  apiRouter.route('/auth/register')
    .post(register, sendToken);

  // Sign In
  // ==================================================
  apiRouter.route('/auth/login')
    .post(login, sendToken);

  // Sign Out
  // ==================================================
  apiRouter.route('/auth/logout')
    .get(logout);

  // Request Token
  // ==================================================
  apiRouter.route('/auth/request-token')
    .get(requestToken, sendToken);

  // Forgot Password
  // ==================================================
  apiRouter.route('/auth/forgot-password')
    .post(forgotPassword);

  // Reset Password
  apiRouter.route('/auth/reset-password/:accessToken')
    .post(resetPassword, sendToken);

  // Verify user email
  // ==================================================
  apiRouter.route('/auth/verify-email/:accessToken')
    .get(verifyEmail, sendToken);

  /*
  // OAuth Routes
  // ==================================================

  // Facebook OAuth
  // ==================================================
  apiRouter.get('/oauth/facebook', AuthController.OAuth.facebook);

  apiRouter.get('/oauth/facebook/callback', AuthController.OAuth.facebookCallback);

  // Google OAuth
  // ==================================================
  apiRouter.get('/oauth/google', AuthController.OAuth.google);

  apiRouter.get('/oauth/google/callback', AuthController.OAuth.googleCallback);=

  // LinkedIn OAuth
  // ==================================================
  apiRouter.get('/oauth/linkedin', AuthController.OAuth.linkedin);

  apiRouter.get('/oauth/linkedin/callback', AuthController.OAuth.linkedinCallback);
  */
  apiRouter.param('accessToken', findAccessToken);
};
