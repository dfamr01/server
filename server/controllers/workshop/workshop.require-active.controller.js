const logger = require('../../config/log4js')('event-require-active-ctrl');
const {isWorkshopDeleted} = require('../../shared/utils');

exports.workshopRequireActive = async function (req, res, next) {
  const {workshop} = req;
  if (isWorkshopDeleted(workshop.status)) {
    return res.status(404).jsend.fail(new Error('workshop is Deleted'), {error: 'workshopIsDeleted'});
  }
  return next()
};