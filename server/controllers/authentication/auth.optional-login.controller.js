const passport = require('passport');
const logger = require('../../config/log4js')('auth-optionalLogin-ctrl');

exports.optionalLogin = function (req, res, next) {
  const adminView = req.query.adminView || req.body.adminView || false;
  if (adminView) {
    return passport.authenticate('jwt', (err, user, info) => {
      if (err) {
        logger.error(err);

        return next(err);
      }

      if (!user) {
        logger.error(info);

        return res.status(401).jsend.fail(new Error('Unauthorized'));
      }

      return req.login(user, next);
    })(req, res, next);
  }

  return next();
};
