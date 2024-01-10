const {Op, literal} = require('sequelize');
const {pick} = require("lodash");
const logger = require('../../config/log4js')('event-get-all-upcoming-ctrl');
const User = require('../../shared/database/models/user.model');
const Event = require('../../shared/database/models/event.model');
const UserFollowing = require('../../shared/database/models/userFollowing.model');
const EventRegistration = require('../../shared/database/models/eventRegistration.model');
const Occurrence = require('../../shared/database/models/occurrence.model');
const {PAGE_SIZE, EVENT_STATUS} = require('../../shared/config/constants');

const {
  processOccurrences,
  cloudinaryUrlWithTrans,
  getUserDetails,
  findCategoryByValue
} = require('../../shared/utils');

const {
  coverPhoto,
  coverPhotoThumbnail,
  coverPhotoHomePage,
  coverPhotoInspect
} = require('../../config/config');

exports.getAllUpcoming = async function (req, res, next) {
  try {
    let {id: UserId} = req.user;
    let {filters, page, pageSize} = req.body;
    page = (+page || 0);

    const registrations = await EventRegistration.findAll({
      where: {
        UserId,
        WorkshopId: null
      },
      attributes: ['id', 'EventId', 'OccurrenceId']
    });

    const where = {
      id: registrations.map(({EventId}) => EventId),
      status: {
        [Op.not]: EVENT_STATUS.DELETED.key
      },
      WorkshopId: {
        [Op.eq]: null
      }
    };

    if (filters && Object.keys(filters).length) {
      if (filters.category) {
        const foundCategory = findCategoryByValue(filters.category);
        if (foundCategory) {
          let cats = [filters.category];
          if (foundCategory.sub && foundCategory.sub.length) {
            cats = [...cats, ...foundCategory.sub.map(({value}) => value)]
          }
          where.categories = {
            [Op.contained]: cats
          };
        }
      }
    }

    const queryBuilder = {
      where,
      order: [
        [Occurrence, 'date', 'ASC']
      ],
      include: [
        {
          model: User,
          required: true,
          attributes: ['id'],
          include: ['UserProfile']
        },
        {
          model: Occurrence,
          required: true,
          where: {
            date: {
              [Op.gte]: literal(`now() - "Event"."duration" * interval '1 second'`)
            }
          },
          include: {
            required: true,
            attributes: ['id'],
            model: EventRegistration,
          }
        }
      ]
    };

    let rows = await Event.findAll(queryBuilder);

    let _pageSize = +pageSize || PAGE_SIZE;
    let _page = Math.max(+page, 0);
    const count = rows.length;

    const events = (rows || []).splice(_page * _pageSize, _pageSize);

    const rowResults = [];
    const users = {};
    const l = events.length;
    let i = 0;
    for (i; i < l; i++) {
      let {
        id,
        isLive,
        allowDropIn,
        isPrivate,
        paymentType,
        title,
        summary,
        coverPhotoDetails,
        price,
        currency,
        rating,
        Occurrences,
        duration,
        UserId,
        User,
        WorkshopId,
        status,
        recordEvent,
        recordDuration,
        categories
      } = events[i];

      const UserProfiles = {...User.UserProfile.dataValues};

      if (!users[UserId]) {
        users[UserId] = await UserFollowing.count({where: {toUserId: UserId}});
      }
      UserProfiles.followersCount = users[UserId];
      rowResults.push({
        id,
        isEvent: true,
        isLive,
        allowDropIn,
        isPrivate,
        paymentType,
        title,
        summary,
        coverPhotoDetails,
        coverPhoto: cloudinaryUrlWithTrans(coverPhotoDetails, coverPhoto.transformation),
        coverPhotoThumbnail: cloudinaryUrlWithTrans(coverPhotoDetails, coverPhotoThumbnail.transformation),
        coverPhotoHomePage: cloudinaryUrlWithTrans(coverPhotoDetails, coverPhotoHomePage.transformation),
        coverPhotoInspect: cloudinaryUrlWithTrans(coverPhotoDetails, coverPhotoInspect.transformation),
        price,
        currency,
        rating,
        occurrences: processOccurrences(Occurrences.map((occurrence) => {
          const registrationsCount = occurrence.registrationsCount;
          const occ = pick(occurrence, Occurrence.getAllowedFieldsByKey('getAll'));
          occ.registrationsCount = registrationsCount;
          return occ;
        })),
        duration,
        user: getUserDetails(UserProfiles),
        UserId,
        WorkshopId,
        status,
        recordEvent,
        recordDuration,
        categories
      });
    }
    return res.status(200).jsend.success({
      events: {
        page,
        pageSize: _pageSize,
        totalPages: Math.ceil(count / _pageSize),
        totalRows: +count,
        rows: rowResults
      }
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};
