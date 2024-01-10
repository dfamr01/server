const logger = require('../../config/log4js')('currencies-get-rates-ctrl');
const {Currencies} = require('../../shared/utils');

exports.getRates = async function (req, res, next) {

  try {
    return res.status(200).jsend.success({rates: Currencies.getRates()});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

