const passport = require('passport');
const {Strategy: LinkedInStrategy} = require('passport-linkedin-oauth2');
const logger = require('../log4js')('oauth');

const config = require('../config');
const {OAuth} = require('../../controllers/authentication');
const {getDefaultProfilePicture} = require('../../shared/utils');

const linkedinOptions = {
  clientID: config.linkedin.clientID,
  clientSecret: config.linkedin.clientSecret,
  callbackURL: config.linkedin.callbackURL,
  passReqToCallback: true,
  scope: ['r_emailaddress', 'r_basicprofile'],
  state: true,
};

module.exports = function () {
  passport.use(new LinkedInStrategy(linkedinOptions, (req, accessToken, refreshToken, profile, done) => {
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
      provider: 'linkedin',
      providerId: profile.id,
      providerData,
      profilePicture: getProfilePicture(providerData)
    };

    OAuth.saveOAuthUserProfile(req, providerUserProfile, done);
  }));
};

function getProfilePicture(data) {
  try {
    return data.pictureUrls.values[0];
  } catch (e) {
    logger.error('Profile picture not found', e);
    return getDefaultProfilePicture();
  }
}