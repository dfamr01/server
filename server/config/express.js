const helment = require('helmet');
const bodyParser = require('body-parser');
const compression = require('compression');
const flash = require('connect-flash');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const log4js = require('log4js');
const methodOverride = require('method-override');
const passport = require('passport');
//  const morgan = require('morgan'); - to log server requests

const config = require('./config');
const jsend = require('../shared/utils/jsend');
const {errorHandler, createClient, getPrimusFolder} = require('../shared/utils');

module.exports = function () {
  const app = express();
  const apiRouter = express.Router();
  const logger = log4js.getLogger('http');

  //  app.use(morgan('combined')); - to log server requests

  // Middlewares
  // ==================================================
  app.use(helment());
  app.use(jsend());

  app.use(compression());


  app.use(methodOverride());

  app.use(session({
    store: new RedisStore({client: createClient()}),
    saveUninitialized: true,
    resave: true,
    secret: config.secret,
  }));

  app.use(flash());

  // power by.
  app.use((req, res, next) => {
    res.set(`X-Powered-By`, config.appName);
    next();
  });

  // Logger
  // ==================================================
  app.use(log4js.connectLogger(logger, {
    format: config.logger.formatHttp,
    nolog: config.logger.nolog,
  }));

  // Passport
  // ==================================================
  app.use(passport.initialize());


  // CORS
  // ==================================================
  app.use(cors());

  // API Routes
  // ==================================================
  //apiVersion
  app.use(config.api.prefix, apiRouter);
  require('../routes/stripe-hooks.routes')(apiRouter);

  apiRouter.use(bodyParser.json());
  apiRouter.use(bodyParser.urlencoded({
    extended: true,
  }));

  require('../routes/admin.routes')(apiRouter);
  require('../routes/auth.routes')(apiRouter);
  require('../routes/channel.routes')(apiRouter);
  require('../routes/currencies.routes')(apiRouter);
  require('../routes/event.routes')(apiRouter);
  require('../routes/favorite.routes')(apiRouter);
  require('../routes/following.routes')(apiRouter);
  require('../routes/payout.routes')(apiRouter);
  require('../routes/stripe.routes')(apiRouter);
  require('../routes/upload.routes')(apiRouter);
  require('../routes/user.routes')(apiRouter);
  require('../routes/workshop.routes')(apiRouter);
  require('../routes/zoom.routes')(apiRouter);

  // We feed app to externals because we need to attach ejs
  require('./expressExternals')(app);

  // we use App as we want the main route.
  app.get('/hello', (req, res, next) => {
    return res.status(200).jsend.success({works: 'world !!!! !!!!!!!!!!'});
  });

  app.get('/', (req, res, next) => {
    return res.status(200).jsend.success({works: 'test'});
  });

  //

  // Error Handler
  // ==================================================
  app.use(errorHandler());

  return app;
};
