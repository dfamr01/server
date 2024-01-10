const logger = require('../../config/log4js')('event-post-registration-ctrl');

const {createEventRegistration} = require('../../shared/helpers/registration.help');

exports.postRegistration = async function postRegistration(req, res, next) {
  try {
    const {user, event} = req;
    const {occurrenceId} = req.params;

    if (!event.isLive) {
      return res.status(404).jsend.fail(new Error('Event must be a live event'), {error: 'noneLiveEvent'});
    }

    const regDetails = {
      UserId: user.id,
      EventId: event.id,
      OccurrenceId: occurrenceId,
      user,
      event,
    };

    const registration = await createEventRegistration(regDetails)
      .catch((error) => {
        return res.status(409).jsend.fail(error);
      });

    return res.status(200).jsend.success({registration});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

