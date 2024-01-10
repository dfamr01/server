const logger = require('../../config/log4js')('event-require-active-ctrl');
const {isEventDeleted} = require('../../shared/utils');

exports.eventRequireActive = async function (req, res, next) {
  const {event} = req;
  if (isEventDeleted(event.status)) {
    return res.status(404).jsend.fail(new Error('Event is Deleted'), {error: 'eventIsDeleted'});
  }
  return next();
};