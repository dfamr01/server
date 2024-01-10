const passport = require('passport');
const localStrategy = require('./strategies/local');
const jwtStrategy = require('./strategies/jwt');
const facebookStrategy = require('./strategies/facebook');
const googleStrategy = require('./strategies/google');
const linkedinStrategy = require('./strategies/linkedin');

const User = require('../shared/database/models/user.model');

module.exports = function () {

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findByPk(id, {include: User.includesForAuth})
      .then((err, user) => {
        done(err, user);
      });
  });

  localStrategy();
  jwtStrategy();
  //  facebookStrategy();
  //  googleStrategy();
  //  linkedinStrategy();
};
