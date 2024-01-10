const logger = require('../../config/log4js')('favorite-get-tile-ctrl');
const UserFavorite = require('../../shared/database/models/userFavorite.model');
const UserProfile = require('../../shared/database/models/userProfile.model');
const Event = require('../../shared/database/models/event.model');
const Workshop = require('../../shared/database/models/workshop.model');
const Occurrence = require('../../shared/database/models/occurrence.model');
const UserFollowing = require('../../shared/database/models/userFollowing.model');
const {EVENT_STATUS} = require('../../shared/config/constants');

const {
  getEventsCount,
  getWorkshopEventsInfo,
  getWorkshopSchedule,
  processOccurrences,
  getUserDetails
} = require('../../shared/utils');

const {getPrice} = require('../../shared/utils/money.utils');
const EventRegistration = require("../../shared/database/models/eventRegistration.model");

exports.getFavoriteTile = async function (req, res, next) {
  try {
    const {user} = req;
    let {ids} = req.query;

    if (!ids || !ids.length) {
      return res.status(400).jsend.fail(new Error('Nothing to fetch'));
    }

    const l = ids.length;
    let i = 0;

    const favoritesTile = [];
    const userProfiles = {};

    for (i; i < l; i++) {
      const id = +ids[i];
      const favorite = await UserFavorite.findOne({where: {id, UserId: user.id}});
      if (!favorite) {
        return res.status(400).jsend.fail(new Error(`Favorite ${id} not found`));
      }

      const {EventId, WorkshopId} = favorite;
      let row = {};
      let error = null;

      if (EventId) {
        row = await Event.findOne({where: {id: EventId}, include: Event.includesForGet});
        error = new Error(`Event ${EventId} not found`);
      } else {
        row = await Workshop.findOne({
          where: {
            id: WorkshopId
          },
          include: {
            model: Event,
            where: {
              status: EVENT_STATUS.PUBLISHED.key
            },
            include: {
              model: Occurrence,
            }

          }
        });

        error = new Error(`Event ${WorkshopId} not found`);
      }

      if (!row) {
        return res.status(400).jsend.fail(error);
      }

      const {UserId} = row;
      if (!userProfiles[UserId]) {
        userProfiles[UserId] = await UserProfile.findOne({where: {UserId: UserId}}) || {};
        userProfiles[UserId].followersCount = await UserFollowing.count({where: {toUserId: UserId}})
      }

      if (EventId) {
        favoritesTile.push({
          favoriteId: id,
          id: EventId,
          isEvent: true,
          isLive: row.isLive,
          allowDropIn: row.allowDropIn,
          isPrivate: row.isPrivate,
          paymentType: row.paymentType,
          title: row.title,
          summary: row.summary,
          coverPhoto: row.coverPhoto,
          coverPhotoThumbnail: row.coverPhotoThumbnail,
          coverPhotoHomePage: row.coverPhotoHomePage,
          coverPhotoInspect: row.coverPhotoInspect,
          price: row.price,
          currency: row.currency,
          rating: row.rating,
          occurrences: processOccurrences(row.Occurrences),
          duration: row.duration,
          user: getUserDetails(userProfiles[UserId]),
          UserId: row.UserId,
          WorkshopId: row.WorkshopId,
          status: row.status,
          recordEvent: row.recordEvent,
          recordDuration: row.recordDuration,
          categories: row.categories
        });
      }

      if (WorkshopId) {
        const {date, endDate, duration} = getWorkshopSchedule(row.Events);
        favoritesTile.push({
          favoriteId: id,
          id: WorkshopId,
          isEvent: false,
          isPrivate: row.isPrivate,
          paymentType: row.paymentType,
          title: row.title,
          summary: row.summary,
          coverPhoto: row.coverPhoto,
          coverPhotoThumbnail: row.coverPhotoThumbnail,
          coverPhotoHomePage: row.coverPhotoHomePage,
          coverPhotoInspect: row.coverPhotoInspect,
          price: getPrice(row.price),
          currency: row.currency,
          rating: row.rating,
          date,
          endDate,
          duration,
          user: getUserDetails(userProfiles[UserId]),
          UserId: row.UserId,
          status: row.status,
          eventsCount: getEventsCount(row.Events),
          eventsInfo: getWorkshopEventsInfo(row.Events),
          categories: row.categories
        });
      }
    }

    return res.status(200).jsend.success({favoritesTile});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

