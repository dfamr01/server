const passport = require('passport');
const {OAuth2Strategy: GoogleStrategy} = require('passport-google-oauth');
const logger = require('../log4js')('oauth');

const config = require('../config');
const {OAuth} = require('../../controllers/authentication');
const {getDefaultProfilePicture} = require('../../shared/utils');

const googleOptions = {
  clientID: config.google.clientID,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.callbackURL,
  passReqToCallback: true,
};

module.exports = function () {
  passport.use(new GoogleStrategy(googleOptions, (req, accessToken, refreshToken, profile, done) => {
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
      provider: 'google',
      providerId: profile.id,
      providerData,
      profilePicture: getProfilePicture(providerData)
    };

    OAuth.saveOAuthUserProfile(req, providerUserProfile, done);
  }));
};

function getProfilePicture(data) {
  try {
    return data.image.url.split('?sz')[0];
  } catch (e) {
    logger.error('Profile picture not found', e);
    return getDefaultProfilePicture();
  }
}