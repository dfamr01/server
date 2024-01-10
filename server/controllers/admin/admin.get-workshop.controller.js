const logger = require('../../config/log4js')('admin-get-workshop');

exports.getWorkshop = function (req, res, next) {
  try {
    const {workshop} = req;
    return res.status(200).jsend.success({
      workshop: workshop.filterFieldsFor({key: 'get', rootOnly: true}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

