const logger = require('../../config/log4js')('auth-requestToken-ctrl');

const User = require('../../shared/database/models/user.model');

exports.requestToken = function (req, res, next) {
  let userID, validOAuth;

  try {
    userID = req.session.passport.user;
    validOAuth = req.session.validOAuth;
  } catch (e) {
    logger.error(new Error('No active passport session.'));

    return respondUnauthorized();
  }

  if (!validOAuth) {
    logger.error(new Error('Not logged in by OAuth.'));

    return respondUnauthorized();
  } else {
    delete req.session.validOAuth;
  }

  User
    .findById(userID)
    .then(user => {
      if (!user) {
        return respondUnauthorized();
      }

      if ('local' === user.provider) {
        return res.redirect('/');
      }

      req.user = user;

      next();
    })
    .catch(next);

  function respondUnauthorized() {
    return res.status(401).jsend.fail(new Error('Unauthorized'));
  }
};
