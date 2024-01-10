const logger = require('../../config/log4js')('event-get-container-ctrl');
const {processOccurrences, isEventInFuture, isEventDeleted} = require('../../shared/utils');
const {EVENT_STATUS} = require('../../shared/config/constants');

exports.getContainer = async function (req, res, next) {
  try {
    let {adminView} = req.query;
    const {event} = req;

    if (isEventDeleted(event.status)) {
      return res.status(404).jsend.fail(new Error('Event is Deleted'), {error: 'eventIsDeleted'});
    }

    if (!adminView && event.status !== EVENT_STATUS.PUBLISHED.key) {
      return res.status(404).jsend.fail(new Error('Unable to fetch this event'));
    }

    return res.status(200).jsend.success({
      event: {
        ...event.filterFieldsFor({key: adminView ? 'container' : 'get'}),
        occurrences: processOccurrences(event.Occurrences.map((occurrence) => {
          const occ = occurrence.filterFieldsFor({key: adminView ? 'getAll' : 'get'})
          occ.registrationsCount = occurrence?.registrationsCount || 0;
          return occ;
        })),
        isInFuture: isEventInFuture(event),
      },
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};
