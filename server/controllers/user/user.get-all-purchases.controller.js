const logger = require('../../config/log4js')('user-get-all-purchases');
const {TRANSACTION_STATUS} = require('../../shared/config/constants');
const User = require('../../shared/database/models/user.model');
const Transaction = require('../../shared/database/models/transaction.model');
const Workshop = require('../../shared/database/models/workshop.model');
const Event = require('../../shared/database/models/event.model');
const Occurrence = require('../../shared/database/models/occurrence.model');
const UserProfile = require('../../shared/database/models/userProfile.model');
const UserFollowing = require('../../shared/database/models/userFollowing.model');

const {
  processOccurrences,
  getWorkshopSchedule,
  getEventsCount,
  getWorkshopEventsInfo,
  cloudinaryUrlWithTrans,
  getUserDetails,
  sortByProp
} = require('../../shared/utils');

const {getPrice} = require('../../shared/utils/money.utils');

const {
  coverPhoto,
  coverPhotoThumbnail,
  coverPhotoHomePage,
  coverPhotoInspect
} = require('../../config/config');

exports.getAllPurchases = async function (req, res, next) {
  try {
    const {query, user} = req;
    let {isWorkshop, isLive} = query;
    let dbQuery;
    const dbQueryWhere = {
      where: {
        buyerId: user.id,
        status: TRANSACTION_STATUS.FULFILLED.key,
      },
    };

    let rows = [];
    if (isWorkshop) {
      dbQuery = {
        ...dbQueryWhere,
        subQuery: false,
        include: [
          {
            model: Workshop,
            required: true,
            include: [
              {
                model: User,
                include: [
                  {
                    model: UserProfile
                  }
                ]
              },
              {
                model: Event,
                required: true,
                include: [
                  {
                    model: Occurrence
                  }
                ]
              }
            ],
          }
        ]
      };
      const rawRows = await Transaction.findAll({...dbQuery});
      rows = (rawRows || [])
        .map((transaction) => {
          const {Workshop} = transaction;
          const occurrences = Workshop.Events
            .filter(({Occurrences}) => !!Occurrences.length)// remove all event with occurrences
            .map(({Occurrences}) => Occurrences[0])// return just the first occurrence
            .sort(sortByProp('date'));// sort by occurrence date.
          transaction.startDate = occurrences.length ? occurrences[0].date : Workshop.createdAt;
          return transaction;
        })
        .sort(sortByProp('startDate'))
        .map((transaction) => ({
          workshop: transaction.Workshop,
          transaction: transaction.filterFieldsFor({key: 'get'})
        }));
    } else if (isLive) {
      dbQueryWhere.where.WorkshopId = null;
      dbQuery = {
        ...dbQueryWhere,
        include: [
          {
            model: Event,
            include: [
              {
                model: User,
                include: [
                  {
                    model: UserProfile
                  }
                ]
              }
            ],
            where: {
              isLive: true
            }
          },
          {
            model: Occurrence
          }
        ]
      };
      const rawRows = await Transaction.findAll({...dbQuery});
      rows = (rawRows || [])
        .map((transaction) => {
          const {Occurrence} = transaction;
          transaction.startDate = Occurrence.date;
          return transaction;
        })
        .sort(sortByProp('startDate'))
        .map((transaction) => ({
          event: transaction.Event,
          transaction: transaction.filterFieldsFor({key: 'get'}),
          occurrence: transaction.Occurrence.filterFieldsFor({key: 'get'}),
        }));
    } else {
      dbQueryWhere.where.WorkshopId = null;
      dbQuery = {
        ...dbQueryWhere,
        include: [
          {
            model: Event,
            include: [
              {
                model: User,
                include: [
                  {
                    model: UserProfile
                  }
                ]
              }
            ],
            where: {
              isLive: false
            }
          }
        ]
      };
      const rawRows = await Transaction.findAll({...dbQuery});
      rows = (rawRows || [])
        .sort(sortByProp('createdAt'))
        .map((transaction) => ({
          event: transaction.Event,
          transaction: transaction.filterFieldsFor({key: 'get'})
        }));
    }

    const rowResults = [];
    const users = {};
    const l = rows.length;
    let i = 0;
    for (i; i < l; i++) {
      if (isWorkshop) {
        let {
          workshop,
          transaction
        } = rows[i];

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
          UserId,
          User,
          status,
          Events,
          categories,
        } = workshop;
        const {UserProfile} = User;

        if (!users[UserId]) {
          users[UserId] = await UserFollowing.count({where: {toUserId: UserId}});
        }
        UserProfile.followersCount = users[UserId];

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
          user: getUserDetails(UserProfile),
          UserId,
          eventsCount: getEventsCount(Events),
          eventsInfo: getWorkshopEventsInfo(Events),
          status,
          categories,
          transaction
        });
      } else {
        let {
          event,
          transaction,
          occurrence
        } = rows[i];

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
          duration,
          UserId,
          User,
          WorkshopId,
          status,
          recordEvent,
          recordDuration,
          categories,
        } = event;
        const {UserProfile} = User;

        if (!users[UserId]) {
          users[UserId] = await UserFollowing.count({where: {toUserId: UserId}});
        }
        UserProfile.followersCount = users[UserId];
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
          occurrences: processOccurrences([occurrence]),
          duration,
          user: getUserDetails(UserProfile),
          UserId,
          WorkshopId,
          status,
          recordEvent,
          recordDuration,
          categories,
          transaction,
        });
      }
    }

    return res.status(200).jsend.success({
      purchases: {
        page: 0,
        pageSize: 0,
        totalPages: 0,
        totalRows: 0,
        rows: rowResults
      }
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

