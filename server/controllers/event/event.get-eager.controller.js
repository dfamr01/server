const {UNLIMITED_SIZE} = require("../../shared/config/constants");
const logger = require('../../config/log4js')('event-get-eager-ctrl');

exports.getEager = async function (req, res, next) {
  try {
    const {event} = req;
    const eventFiltered = event.filterFieldsFor({key: 'getEager'});
    if (!eventFiltered.participantsLimit) {
      eventFiltered.participantsLimit = UNLIMITED_SIZE;  //this is instead of changing the db default value as in the future we will want to do premium
    }

    if (!eventFiltered.duration) {
      eventFiltered.duration = 40;  //this is instead of changing the db default value as in the future we will want to do premium
      eventFiltered.streamDuration = 40;  //this is instead of changing the db default value as in the future we will want to do premium
    }
    const {Occurrences} = event;
    
    if (event.isLive && Occurrences) {
      event?.Occurrences.forEach((el, index) => {
        const registrationsCount = el.registrationsCount;
        eventFiltered.occurrences[index].registrationsCount = registrationsCount;
      });
    }
    return res.status(200).jsend.success({
      event: eventFiltered,
      // event: event.filterFieldsFor({key: 'getEager'}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

