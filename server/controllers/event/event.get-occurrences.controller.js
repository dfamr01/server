const {getRegistrationsCount: getRegistrationCount} = require("../../shared/utils/db.utils");
const logger = require('../../config/log4js')('event-get-occurrence-ctrl');

exports.getOccurrences = async function (req, res, next) {
  try {
    const {event} = req;

    const {Occurrences} = event;
    if (!Occurrences || !Occurrences.length) {
      return res.status(200).jsend.success({
        occurrence: [],
      });
    }

    return res.status(200).jsend.success({
      occurrences: Occurrences.map((occurrence) => occurrence.filterFieldsFor({key: 'get'})),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }

};

