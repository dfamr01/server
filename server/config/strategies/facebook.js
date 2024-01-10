const passport = require('passport');
const {Strategy: FacebookStrategy} = require('passport-facebook');
const logger = require('../log4js')('oauth');

const config = require('../config');
const {OAuth} = require('../../controllers/authentication');

const facebookOptions = {
  clientID: config.facebook.clientID,
  clientSecret: config.facebook.clientSecret,
  callbackURL: config.facebook.callbackURL,
  passReqToCallback: true,
  profileFields: ['id', 'emails', 'name'],
};

module.exports = function () {
  passport.use(new FacebookStrategy(facebookOptions, (req, accessToken, refreshToken, profile, done) => {
    let providerData = profile._json;

    providerData.accessToken = accessToken;
    providerData.refreshToken = refreshToken;

    try {
      profile.email = profile.emails[0].value;
    } catch (e) {
      logger.error('Email not found', e);
    }

    let providerUserProfile = {
      name: `${profile.name.givenName} ${profile.name.familyName}`,
      email: profile.email,
      provider: 'facebook',
      providerId: profile.id,
      providerData,
      profilePicture: `https://graph.facebook.com/${profile.id}/picture?type=large`
    };

    OAuth.saveOAuthUserProfile(req, providerUserProfile, done);
  }));
};
