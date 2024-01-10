const logger = require('../../config/log4js')('workshop-getEager-ctrl');

exports.getEager = async function (req, res, next) {
  try {
    const {workshop} = req;
    return res.status(200).jsend.success({
      workshop: workshop.filterFieldsFor({key: 'getEager'}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

