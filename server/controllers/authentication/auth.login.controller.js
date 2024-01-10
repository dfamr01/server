const passport = require('passport');
const logger = require('../../config/log4js')('auth-login-ctrl');


exports.login = function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      logger.error(err);

      return next(err);
    }

    if (!user) {
      logger.error(info);

      return res.status(401).jsend.fail(info);
    }

    return req.login(user, next);
  })(req, res, next);
};
