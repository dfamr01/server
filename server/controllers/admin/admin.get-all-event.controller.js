const logger = require('../../config/log4js')('admin-get-all-events');
const {PAGE_SIZE} = require('../../shared/config/constants');
const Event = require('../../shared/database/models/event.model');

exports.getAllEvents = async function (req, res, next) {
  try {
    const {query} = req;
    let {orderBy, orderDir, page, pageSize, UserId, EventId, WorkshopId} = query;

    const dbQuery = {
      where: {},
    };

    if (UserId) {
      dbQuery.where.UserId = UserId;
    }

    if (WorkshopId) {
      dbQuery.where.WorkshopId = WorkshopId;
    } else {
      if (EventId) {
        dbQuery.where.id = EventId;
      }
    }

    orderBy = orderBy || 'createdAt';
    orderDir = orderDir || 'ASC';

    dbQuery.order = [[orderBy, orderDir]];

    let _page = +page || 0;
    let _pageSize = +pageSize || PAGE_SIZE;

    dbQuery.offset = _page * _pageSize;
    dbQuery.limit = _pageSize;

    const rows = await Event.findAll({...dbQuery});
    const count = await Event.count(dbQuery);

    return res.status(200).jsend.success({
      events: {
        page: _page,
        pageSize: _pageSize,
        totalPages: Math.ceil(count / _pageSize),
        totalRows: count,
        rows: (rows || []).map((event) => event.filterFieldsFor({key: 'get'}))
      }
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

