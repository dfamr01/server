const express = require('express');
//const logger = require('../config/log4js')('auth router');

const {
  getRates,
} = require('../controllers/currencies');

module.exports = function (apiRouter) {
  const userRouter = express.Router();

  // Path: /currencies
  apiRouter.use('/currencies', userRouter);


  // currencies get
  // Path: /getRates
  // ==================================================
  userRouter.route('/getRates')
    .get(getRates);

};
