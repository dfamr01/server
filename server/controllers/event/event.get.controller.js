const {getRegistrationsCount: getRegistrationCount} = require("../../shared/utils/db.utils");
const logger = require('../../config/log4js')('event-get-ctrl');

exports.get = async function (req, res, next) {
  try {
    const {event, query} = req;
    const {Occurrences} = event;
    const occurrenceId = Number(query.occurrenceId);

    if (event.isLive && occurrenceId) {
      const occurrence = Occurrences.find((occurrence) => occurrence.id === occurrenceId);
      if (occurrence) {
        const registrationsCount = await getRegistrationCount({
          OccurrenceId: occurrence.id,
          EventId: event.id
        });
        const liveOccurrence = occurrence.filterFieldsFor({key: 'getAll'});
        liveOccurrence.registrationsCount = registrationsCount;
        return res.status(200).jsend.success({
          event: {
            ...event.filterFieldsFor({key: 'getAll'}),
            occurrence: liveOccurrence,
          },
        });
      }
      return res.status(404).jsend.fail(new Error('Occurrence was not found'));
    } else {
      return res.status(200).jsend.success({
        event: event.filterFieldsFor({key: 'getAll'}),
      });
    }
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

