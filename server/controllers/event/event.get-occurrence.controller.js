const {getRegistrationsCount: getRegistrationCount} = require("../../shared/utils/db.utils");
const logger = require('../../config/log4js')('event-get-occurrence-ctrl');

exports.getOccurrence = async function (req, res, next) {
  try {
    const {event} = req;
    const {occurrenceId} = req.params;

    const {Occurrences} = event;
    if (!Occurrences || !Occurrences.length) {
      return res.status(200).jsend.success({
        occurrence: [],
      });
    }

    if (!occurrenceId) {
      return res.status(404).jsend.fail(new Error('Occurrence was not found'));
    }

    const occurrence = Occurrences.find((occurrence) => occurrence.id === Number(occurrenceId));
    if (occurrence) {
      const occ = occurrence.filterFieldsFor({key: 'getAll'});

      if (event.isLive) {
        const registrationsCount = await getRegistrationCount({
          OccurrenceId: occurrence.id,
          EventId: event.id
        })
        occ.registrationsCount = registrationsCount;
      }

      return res.status(200).jsend.success({
        event: {
          ...event.filterFieldsFor({key: 'getAll'}),
          occurrence: occ,
        },
      });
    }


  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }

};

