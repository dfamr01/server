const logger = require('../../config/log4js')('user-get-access-control-ctrl');

exports.getAccessControl = function (req, res, next) {
  try {
    const {user, query} = req;

    const toUserId = Number(query.toUserId);
    const toEventId = Number(query.toEventId);
    const toWorkshopId = Number(query.toWorkshopId);
    const toOccurrenceId = Number(query.toOccurrenceId);

    return res.status(200).jsend.success({
      accessControls: (user.AccessControls || [])
        .filter((accessControl) => {
          let keepAC = true;
          if (toUserId && toUserId !== accessControl.toUserId) {
            keepAC = false;
          }
          if (toEventId && toEventId !== accessControl.toEventId) {
            keepAC = false;
          }
          if (toWorkshopId && toWorkshopId !== accessControl.toWorkshopId) {
            keepAC = false;
          }
          if (toOccurrenceId && toOccurrenceId !== accessControl.toOccurrenceId) {
            keepAC = false;
          }
          return keepAC;
        })
        .map((accessControl) => accessControl.filterFieldsFor({key: 'get'})),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

