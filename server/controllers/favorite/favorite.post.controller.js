const logger = require('../../config/log4js')('favorite-post-ctrl');
const UserFavorite = require('../../shared/database/models/userFavorite.model');

exports.postFavorite = async function (req, res, next) {
  try {
    const {user, body} = req;
    let {eventId, workshopId} = body;
    logger.info('Creating a new favorite and event settings');
    const newFavorite = {
      UserId: user.id
    };

    if (!eventId && !workshopId) {
      return res.status(400).jsend.fail(new Error('Missing parameters, either eventId and workshopId was not found.'));
    }

    if (eventId) {
      newFavorite.EventId = eventId;
    }

    if (workshopId) {
      newFavorite.WorkshopId = workshopId;
    }

    const favoriteFound = await UserFavorite.findOne({where: newFavorite});
    if (favoriteFound) {
      return res.status(400).jsend.fail(new Error('Duplicate error, This favorite already exists'));
    }
    const userFavorite = await UserFavorite.create(newFavorite);
    logger.info('New favorite: ', userFavorite);

    return res.status(200).jsend.success({userFavorite});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

