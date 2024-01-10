const logger = require('../../config/log4js')('workshop-get-rating-ctrl');

exports.getRating = async function (req, res, next) {
  try {
    const {workshop} = req;
    return res.status(200).jsend.success({
      workshopRatings: (workshop.WorkshopRatings || []).map((workshopRating) =>
        workshopRating.filterFieldsFor({key: 'get'})
      ),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

