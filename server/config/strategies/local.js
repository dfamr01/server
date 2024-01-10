const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const logger = require('../log4js')('strategies.local');
const User = require('../../shared/database/models/user.model');

const localOptions = {
  usernameField: 'email',
};
module.exports = () => {
  passport.use(new LocalStrategy(localOptions, (email = '', password, done) => {
    const badCredentialsError = new Error('Invalid email/password. Please try again.');
    User
      .findOne({where: {email: email.toLowerCase()}, include: User.includesForAuth})
      .then((user) => {

        if (!user) {
          return done(null, false, badCredentialsError);
        }

        if (user.provider !== 'local') {
          const message = new Error(`Not local user trying to login. Provider ->${user.provider}`);
          logger.error(message);
          return done(null, false, message);
        }

        if (!user.authenticate(password)) {
          return done(null, false, badCredentialsError);
        }

        return done(null, user);
      })
      .catch(done);
  }));
};
