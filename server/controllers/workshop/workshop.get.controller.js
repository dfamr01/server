const logger = require('../../config/log4js')('workshop-get-ctrl');

exports.get = function (req, res, next) {
  try {
    const {workshop} = req;
    const workshopFiltered = workshop.filterFieldsFor({key: 'getEager'});
    workshopFiltered.registrationsCount = workshop.registrationsCount;
    return res.status(200).jsend.success({
      workshop: workshopFiltered,
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};
