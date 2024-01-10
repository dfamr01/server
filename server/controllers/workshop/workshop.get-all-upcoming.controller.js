const {Op, literal} = require('sequelize');
const logger = require('../../config/log4js')('workshop-get-all-upcoming-ctrl');
const User = require('../../shared/database/models/user.model');
const Workshop = require('../../shared/database/models/workshop.model');
const Event = require('../../shared/database/models/event.model');
const UserFollowing = require('../../shared/database/models/userFollowing.model');
const WorkshopRegistration = require('../../shared/database/models/workshopRegistration.model');
const EventRegistration = require('../../shared/database/models/eventRegistration.model');
const Occurrence = require('../../shared/database/models/occurrence.model');
const {PAGE_SIZE, EVENT_STATUS, WORKSHOP_STATUS} = require('../../shared/config/constants');

const {
  cloudinaryUrlWithTrans,
  getUserDetails,
  getWorkshopSchedule,
  getEventsCount,
  getWorkshopEventsInfo,
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

    const registrations = await WorkshopRegistration.findAll({
      where: {
        UserId
      },
      attributes: ['id', 'WorkshopId']
    });

    const where = {
      id: registrations.map(({WorkshopId}) => WorkshopId),
      status: {
        [Op.not]: WORKSHOP_STATUS.DELETED.key
      },
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
        [Event, Occurrence, 'date', 'ASC']
      ],
      include: [
        {
          model: Event,
          required: true,
          attributes: ['id', 'isLive', 'duration', 'status'],
          where: {
            status: {
              [Op.not]: EVENT_STATUS.DELETED.key
            },
          },
          include: [
            {
              model: Occurrence,
              required: true,
              where: {
                date: {
                  [Op.gte]: literal(`now() - "Events"."duration" * interval '1 second'`)
                }
              },
              include: {
                required: true,
                attributes: ['id'],
                model: EventRegistration,
              }
            }
          ]
        },
        {
          model: User,
          required: true,
          attributes: ['id'],
          include: ['UserProfile']
        },
      ]
    };

    let rows = await Workshop.findAll(queryBuilder);

    let _pageSize = +pageSize || PAGE_SIZE;
    let _page = Math.max(+page, 0);
    const count = rows.length;

    const workshops = (rows || []).splice(_page * _pageSize, _pageSize);

    const rowResults = [];
    const users = {};
    const l = workshops.length;
    let i = 0;
    for (i; i < l; i++) {
      let {
        id,
        isPrivate,
        paymentType,
        title,
        summary,
        coverPhotoDetails,
        price,
        currency,
        rating,
        User,
        UserId,
        status,
        Events,
        categories
      } = workshops[i];

      const UserProfiles = {...User.UserProfile.dataValues};

      if (!users[UserId]) {
        users[UserId] = await UserFollowing.count({where: {toUserId: UserId}});
      }
      UserProfiles.followersCount = users[UserId];

      const {date, endDate, duration} = getWorkshopSchedule(Events);

      rowResults.push({
        id,
        isEvent: false,
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
        date,
        endDate,
        duration,
        user: getUserDetails(UserProfiles),
        UserId,
        eventsCount: getEventsCount(Events),
        eventsInfo: getWorkshopEventsInfo(Events),
        status,
        categories
      });
    }
    return res.status(200).jsend.success({
      workshops: {
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

