const logger = require('../../config/log4js')('workshop-get-all-ctrl');
const Workshop = require('../../shared/database/models/workshop.model');
const Event = require('../../shared/database/models/event.model');
const UserProfile = require('../../shared/database/models/userProfile.model');
const UserFollowing = require('../../shared/database/models/userFollowing.model');
const Occurrence = require('../../shared/database/models/occurrence.model');
const sequelizeConnection = require('../../config/postgre/sequelizeConnection');
const {PAGE_SIZE, ORDER_DIRECTIONS, WORKSHOP_STATUS, EVENT_STATUS} = require('../../shared/config/constants');
const categories = require('../../shared/config/categories');

const {
  getWorkshopSchedule,
  getEventsCount,
  getWorkshopEventsInfo,
  mapResults,
  nestRows,
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
const {WorkshopRegistration} = require("../../shared/database/models");

exports.getAll = async function (req, res, next) {
  try {
    let {order, filters, page, pageSize, offset, limit, adminView} = req.body;
    const queryBuilder = {
      where: {}
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

    const allowedFields = Workshop.getAllowedFieldsByKey('get');
    _order = filteredOrder
      .filter(({column}) => allowedFields.indexOf(column) > -1)
      .map(({column, direction}, index) =>
        index + 1 >= filteredOrder.length
          ? `${column} ${direction}`
          : `${column} ${direction},`
      ).join(' ');

    queryBuilder.order = `ORDER BY "Workshop"."id" ASC`; // default order
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
        queryBuilder.where.categories = `"Workshop"."categories" <@ ARRAY[${cats}]::VARCHAR(255)[]`;
      }

      queryBuilder.where.date = `"Occurrences"."date" < now()`;
      queryBuilder.dateSecondQuery = `
        WHERE
          "Workshop"."id" NOT IN
            (
              SELECT
                "w"."id"
              FROM
                "Workshops" AS "w"
              LEFT JOIN
                "Events" AS "e"
              ON
                "w"."id" = "e"."WorkshopId"
              LEFT JOIN
                "Occurrences" AS "o"
              ON
                "e"."id" = "o"."EventId"
              WHERE
                "o"."date" >= now() - "Events"."duration" * interval '1 second'
            )
       `;
      if (filters.inFutureOnly) {
        queryBuilder.dateSecondQuery = '';
        queryBuilder.where.date = `
        (
          "Occurrences"."date" >= now() - "Events"."duration" * interval '1 second'
          OR
          "Occurrences"."date" IS NULL
        )`;
      }

      if (filters.archivedOnly) {
        queryBuilder.where.status = `"Workshop"."status" = '${WORKSHOP_STATUS.DELETED.key}'`;
        queryBuilder.dateSecondQuery = '';
        delete queryBuilder.where.date;
      }

      const userId = +filters.UserId || +filters.channelId || null;
      if (userId) {
        queryBuilder.where.UserId = `"Workshop"."UserId" = ${userId}`;
      }
    }

    if (!adminView) {
      queryBuilder.where.status = `"Workshop"."status" = '${WORKSHOP_STATUS.PUBLISHED.key}'`;
      queryBuilder.where.eventStatus = `"Events"."status" = '${EVENT_STATUS.PUBLISHED.key}'`;
      queryBuilder.where.isPrivate = `"Workshop"."isPrivate" IS FALSE`;
    } else if (!filters.archivedOnly) {
      queryBuilder.where.status = `"Workshop"."status" != '${WORKSHOP_STATUS.DELETED.key}'`;
    }

    queryBuilder.offset = `OFFSET ${_offset} `;
    queryBuilder.limit = `LIMIT ${_limit} `;
    const whereClause = `${Object.keys(queryBuilder.where).map((key) => queryBuilder.where[key]).join(' AND ')}`;

    const eventFields = Event.getAllowedFieldsByKey('getFields').map((field) => `"Events"."${field}" AS "Events.${field}"`).join(', ');
    const occurrenceFields = Occurrence.getAllowedFieldsByKey(adminView ? 'getAll' : 'get').map((field) => `"Occurrences"."${field}" AS "Occurrences.${field}"`).join(', ');
    const userProfiles = UserProfile.getAllowedFieldsByKey('getFields').map((field) => `"UserProfiles"."${field}" AS "UserProfiles.${field}"`).join(', ');
    // const workshopRegistration = '';
    const workshopRegistration = `"WorkshopRegistrations"."id" AS "Workshop.registrationsCount"`
    // const workshopRegistration = WorkshopRegistration.getAllowedFieldsByKey('id').map((field) => `"WorkshopRegistrations"."${field}" AS "Workshop.registrationsCount"`).join(', ');
    // const workshopRegistration = WorkshopRegistration.getAllowedFieldsByKey('id').map((field) => `"WorkshopRegistrations"."${field}" AS "WorkshopRegistrations.${field}"`).join(', ');

    const query =
      `
        SELECT
          "Workshop".*,
          ${eventFields},
          ${occurrenceFields},
          ${userProfiles}
        FROM
        (
          SELECT
            "Workshop".*,
             (COUNT (DISTINCT("WorkshopRegistrations"."id"))::int) AS "registrationsCount"
          FROM
            "Workshops" AS "Workshop"
          LEFT JOIN
          "WorkshopRegistrations" AS "WorkshopRegistrations"
          ON
          "Workshop"."id" = "WorkshopRegistrations"."WorkshopId"
          LEFT JOIN
            "Events" AS "Events"
          ON
            "Workshop"."id" = "Events"."WorkshopId"
          LEFT JOIN
            "Occurrences" AS "Occurrences"
          ON
            "Events"."id" = "Occurrences"."EventId"
          WHERE
            ${whereClause}
          GROUP BY
            "Workshop"."id"
          ${queryBuilder.order}
          ${queryBuilder.limit}
          ${queryBuilder.offset}
        )
        AS "Workshop"
        LEFT JOIN
          "Events" AS "Events"
        ON
          "Workshop"."id" = "Events"."WorkshopId"
        LEFT JOIN
          "WorkshopRegistrations" AS "WorkshopRegistrations"
        ON
          "Workshop"."id" = "WorkshopRegistrations"."WorkshopId"
        LEFT JOIN
          "Occurrences" AS "Occurrences"
        ON
          "Events"."id" = "Occurrences"."EventId"
        LEFT JOIN
          "UserProfiles" AS "UserProfiles"
        ON
          "Workshop"."UserId" = "UserProfiles"."UserId"
        ${queryBuilder.dateSecondQuery}
        ${queryBuilder.order}
        ;
      `;

    const results = await sequelizeConnection.query(query, {nest: true});
    let nestedResults = nestRows(results, ['Events', 'Occurrences']);

    const models = [
      // {
      //   model: Workshop,
      //   include: 'WorkshopRegistrations'
      // },
      {
        model: Workshop,
        include: 'Events'
      },
      {
        model: Event,
        include: 'Occurrences'
      },
      {
        model: Occurrence
      },
    ];
    let rows = mapResults(nestedResults, models);

    const countQuery = `
    SELECT
      COUNT(1)
    FROM
    (
      SELECT
        "Workshop"."id"
      FROM
      (
        SELECT
          "Workshop".*
        FROM
          "Workshops" AS "Workshop"
        LEFT JOIN
          "Events" AS "Events"
        ON
          "Workshop"."id" = "Events"."WorkshopId"
        LEFT JOIN
          "Occurrences" AS "Occurrences"
        ON
          "Events"."id" = "Occurrences"."EventId"
        LEFT JOIN 
            "UserProfiles" AS "UserProfiles"
        ON 
            "Workshop"."UserId" = "UserProfiles"."UserId"
        WHERE
          ${whereClause}
        GROUP BY
          "Workshop"."id"
      )
      AS "Workshop"
      LEFT JOIN
        "Events" AS "Events"
      ON
        "Workshop"."id" = "Events"."WorkshopId"
      LEFT JOIN
        "Occurrences" AS "Occurrences"
      ON
        "Events"."id" = "Occurrences"."EventId"
      LEFT JOIN 
        "UserProfiles" AS "UserProfiles"
      ON 
        "Workshop"."UserId" = "UserProfiles"."UserId"
      ${queryBuilder.dateSecondQuery}
      GROUP BY
        "Workshop"."id"
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
        isPrivate,
        paymentType,
        title,
        summary,
        coverPhotoDetails,
        price,
        currency,
        rating,
        UserProfiles,
        UserId,
        status,
        Events,
        categories,
        registrationsCount
      } = rows[i];

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
        price: getPrice(price),
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
        categories,
        registrationsCount
      });

    }
    return res.status(200).jsend.success({
      workshops: {
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

