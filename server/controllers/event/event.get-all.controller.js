const moment = require('moment');
const {isBoolean} = require('lodash');
const logger = require('../../config/log4js')('event-get-all-ctrl');
const sequelizeConnection = require('../../config/postgre/sequelizeConnection');
const Event = require('../../shared/database/models/event.model');
const Occurrence = require('../../shared/database/models/occurrence.model');
const UserProfile = require('../../shared/database/models/userProfile.model');
const UserFollowing = require('../../shared/database/models/userFollowing.model');
const {PAGE_SIZE, ORDER_DIRECTIONS, EVENT_STATUS} = require('../../shared/config/constants');
const categories = require('../../shared/config/categories');

const {
  processOccurrences,
  mapResults,
  dateToUtc,
  cloudinaryUrlWithTrans,
  getUserDetails
} = require('../../shared/utils');

const {getPrice} = require('../../shared/utils/money.utils');

const {
  coverPhoto,
  coverPhotoThumbnail,
  coverPhotoHomePage,
  coverPhotoInspect
} = require('../../config/config');
const {EventRegistration} = require("../../shared/database/models");

exports.getAll = async function (req, res, next) {
  try {
    let {order, filters, page, pageSize, offset, limit, adminView} = req.body;
    const models = [
      {
        model: Event,
        include: 'Occurrences'
      },
      {
        model: Occurrence,
        include: 'EventRegistrations'
      },
      {
        model: Occurrence,
      },
    ];
    const queryBuilder = {
      where: {
        WorkshopId: '"Event"."WorkshopId" IS NULL'
      },
    };

    let _order = [];
    let _page = +page || 0;
    let _pageSize = +pageSize || PAGE_SIZE;

    let _offset = +offset >= 0 ? +offset : _page * _pageSize;
    let _limit = +limit >= 0 ? +limit : _pageSize;

    if (order) {
      _order = Array.isArray(order) ? order : [order];
    }

    const filteredOrder = _order
      .filter(({direction}) => ORDER_DIRECTIONS.indexOf(direction) > -1);

    const allowedFields = Event.getAllowedFieldsByKey('get');
    _order = filteredOrder
      .filter(({column}) => allowedFields.indexOf(column) > -1)
      .map(({column, direction}, index) =>
        index + 1 >= filteredOrder.length
          ? `${column} ${direction}`
          : `${column} ${direction},`
      ).join(' ');

    queryBuilder.order = `ORDER BY "Event"."id" ASC`; // default order
    if (_order.length) {
      queryBuilder.order = `ORDER BY  ${_order}`;
    }

    if (filters && Object.keys(filters).length) {
      if (filters.category) {
        let cats = ` '${filters.category}' `;
        const foundParent = categories.find(({value, sub}) => value === filters.category && sub && sub.length);
        if (foundParent) {
          cats += `, ${foundParent.sub.map(({value}) => `'${value}'`).join(', ')}`
        }
        queryBuilder.where.categories = `"Event"."categories" <@ ARRAY[${cats}]::VARCHAR(255)[]`;
      }

      queryBuilder.where.date = `"Occurrences"."date" < now()`;
      queryBuilder.dateSecondQuery = `
      WHERE
        "Event"."id" NOT IN
            (
              SELECT
              "e"."id"
              FROM
              "Events" AS "e"
              LEFT JOIN
              "Occurrences" AS "o"
              ON
              "e"."id" = "o"."EventId"
              WHERE
              "o"."date" > now() - "Event"."duration" * interval '1 second'
            )
       `;
      if (filters.inFutureOnly) {
        queryBuilder.dateSecondQuery = '';
        queryBuilder.where.date = `
        (
          "Occurrences"."date" >= now() - "Event"."duration" * interval '1 second'
          OR
          "Occurrences"."date" IS NULL
        )`;
      }

      if (filters.archivedOnly) {
        queryBuilder.where.status = `"Event"."status" = '${EVENT_STATUS.DELETED.key}'`;
        queryBuilder.dateSecondQuery = '';
        delete queryBuilder.where.date;
      }

      if (isBoolean(filters.isLive)) {
        queryBuilder.where.isLive = `"Event"."isLive" = ${filters.isLive}`;
      }

      const userId = +filters.UserId || +filters.channelId || null;
      if (userId) {
        queryBuilder.where.UserId = `"Event"."UserId" = ${userId}`;
      }

      const workshopId = +filters.WorkshopId;
      if (workshopId) {
        queryBuilder.where.WorkshopId = `"Event"."WorkshopId" = ${workshopId}`;
      }
    }

    if (!adminView) {
      queryBuilder.where.status = `"Event"."status" = '${EVENT_STATUS.PUBLISHED.key}'`;
      queryBuilder.where.isPrivate = `"Event"."isPrivate" IS FALSE`;
    } else if (!filters.archivedOnly) {
      queryBuilder.where.status = `"Event"."status" != '${EVENT_STATUS.DELETED.key}'`;
    }

    queryBuilder.offset = `OFFSET ${_offset} `;
    queryBuilder.limit = `LIMIT ${_limit} `;
    const whereClause = `${Object.keys(queryBuilder.where).map((key) => queryBuilder.where[key]).join(' AND ')}`;
    const occurrenceFields = Occurrence.getAllowedFieldsByKey(adminView ? 'getAll' : 'get').map((field) => `"Occurrences"."${field}" AS "Occurrences.${field}"`).join(', ');
    const userProfiles = UserProfile.getAllowedFieldsByKey('getFields').map((field) => `"UserProfiles"."${field}" AS "UserProfiles.${field}"`).join(', ');
    const eventRegistration = EventRegistration.getAllowedFieldsByKey('get').map((field) => `"EventRegistrations"."${field}" AS "Occurrences.EventRegistrations.${field}"`).join(', ');
    const query = `
      SELECT
        "Event".*,
        ${occurrenceFields},
        ${userProfiles},
        ${eventRegistration}
      FROM
      (
        SELECT
          "Event".*
        FROM
          "Events" AS "Event"
        LEFT JOIN
          "Occurrences" AS "Occurrences"
        ON
          "Event"."id" = "Occurrences"."EventId"
        WHERE
          ${whereClause}
        GROUP BY
          "Event"."id"
        ${queryBuilder.order}
        ${queryBuilder.limit}
        ${queryBuilder.offset}
      )
      AS "Event"
      LEFT JOIN
        "Occurrences" AS "Occurrences"
      ON
        "Event"."id" = "Occurrences"."EventId"
      LEFT JOIN
        "UserProfiles" AS "UserProfiles"
      ON
        "Event"."UserId" = "UserProfiles"."UserId"
     
      LEFT JOIN
        "EventRegistrations" AS "EventRegistrations"
      ON
        "EventRegistrations"."OccurrenceId" = "Occurrences"."id"
        
      ${queryBuilder.dateSecondQuery}
      ${queryBuilder.order}
      ;
    `;

    const results = await sequelizeConnection.query(query, {nest: true});
    const rows = mapResults(results, models);
    // const rows = mapResults([results[5], results[6]], models);
    // const rows = mapResults(results, models);
    const countQuery = `
      SELECT
        COUNT(1)
      FROM
      (
        SELECT
          "Event"."id"
        FROM
        (
          SELECT
            "Event".*
          FROM
            "Events" AS "Event"
          LEFT JOIN
            "Occurrences" AS "Occurrences"
          ON
            "Event"."id" = "Occurrences"."EventId"
          WHERE
            ${whereClause}
          GROUP BY "Event"."id"
        ) AS "Event"
        LEFT JOIN "Occurrences" AS "Occurrences"
        ON "Event"."id" = "Occurrences"."EventId"
        LEFT JOIN "EventRegistrations" AS "EventRegistrations"
        ON "Occurrences"."id" = "EventRegistrations"."OccurrenceId"
        LEFT JOIN "UserProfiles" AS "UserProfiles"
        ON "Event"."UserId" = "UserProfiles"."UserId"
        ${queryBuilder.dateSecondQuery}
        GROUP BY "Event"."id"
      ) q1;
    `;
    const {count} = await sequelizeConnection.query(countQuery, {plain: true});

    const rowResults = [];
    const users = {};
    const l = rows.length;
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
        UserProfiles,
        UserId,
        WorkshopId,
        status,
        recordEvent,
        recordDuration,
        categories
      } = rows[i];

      if (filters && filters.inFutureOnly) {
        const dateNow = dateToUtc();
        if (duration > 0) {
          dateNow.subtract(duration, 'seconds');
        }
        Occurrences = Occurrences.filter(({date}) => moment(date).isAfter(dateNow));
      }

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
        price: getPrice(price),
        currency,
        rating,
        occurrences: processOccurrences(Occurrences),
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
        page: _page,
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

