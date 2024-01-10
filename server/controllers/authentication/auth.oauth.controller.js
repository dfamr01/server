const passport = require('passport');
const logger = require('../../config/log4js')('auth-saveOAuthUserProfile-ctrl');
const search = require('../../config/search');

const User = require('../../shared/database/models/user.model');

function OAuthenticate(req, res, next) {
  return function (err, user, info) {
    if (err) {
      logger.error(err);

      return next(err);
    }

    if (!user) {
      logger.error(info);

      return res.status(401).jsend.fail(new Error('OAuth Error.'));
    }

    return req.login(user, (err) => {
      if (err) {
        return next(err);
      }

      req.session.validOAuth = true;

      return res.redirect('/request-token');
    });
  };
}

exports.facebook = function (req, res, next) {
  return passport.authenticate('facebook', {
    failureRedirect: '/',
    scope: ['email'],
  })(req, res, next);
};

exports.facebookCallback = function (req, res, next) {
  return passport.authenticate('facebook', OAuthenticate(req, res, next))(req, res, next);
};

exports.google = function (req, res, next) {
  return passport.authenticate('google', {
    failureRedirect: '/',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
  })(req, res, next);
};

exports.googleCallback = function (req, res, next) {
  return passport.authenticate('google', OAuthenticate(req, res, next))(req, res, next);
};

exports.linkedin = function (req, res, next) {
  return passport.authenticate('linkedin', {
    failureRedirect: '/',
  })(req, res, next);
};

exports.linkedinCallback = function (req, res, next) {
  return passport.authenticate('linkedin', OAuthenticate(req, res, next))(req, res, next);
};

exports.saveOAuthUserProfile = function (req, profile, done) {
  const {provider, providerId, email} = profile;

  User
    .findOne({provider, providerId}) // find user by provider
    .then((user) => {
      if (!user) {
        return User.findOne({email}); // find user by email
      }

      return user;
    })
    .then((user) => {
      if (user) { // user already exits
        if (user.provider === 'local') { // if user signed up with a local strategy
          return done(null, false, {message: 'User should provide his local credentials.'}); // redirect to sign in
        }

        return done(null, user); // if any other social media, return user
      } else {  // register new user

        user = new User(profile);

        return user.save()
          .then(() => search.indexUser(user))
          .catch(err => done(err, user));
      }
    })
    .catch(done);
};
