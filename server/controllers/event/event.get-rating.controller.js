const logger = require('../../config/log4js')('event-get-rating-ctrl');

exports.getRating = async function (req, res, next) {
  try {
    const {event} = req;
    return res.status(200).jsend.success({
      eventRatings: (event.EventRatings || []).map((eventRating) =>
        eventRating.filterFieldsFor({key: 'get'})
      ),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

