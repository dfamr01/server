const passport = require('passport');
const logger = require('../../config/log4js')('auth-requireLogin-ctrl');

exports.requireLogin = function (req, res, next) {
  return passport.authenticate('jwt', (err, user, info) => {
    if (err) {
      logger.error(err);

      return next(err);
    }

    if (!user) {
      logger.error(info);
      return res.status(401).jsend.fail(new Error('Unauthorized'), {error: info.name});
    }

    return req.login(user, next);
  })(req, res, next);
};
