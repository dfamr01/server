const logger = require('../../config/log4js')('favorite-get-all-ctrl');
const UserFavorite = require('../../shared/database/models/userFavorite.model');
const {PAGE_SIZE} = require('../../shared/config/constants');

exports.getAllFavorites = async function (req, res, next) {
  try {
    const {user, query} = req;
    let {orderBy, orderDir, page, pageSize, eventId, workshopId,} = query;

    const dbQuery = {
      where: {
        UserId: user.id
      },
    };

    if (eventId) {
      dbQuery.where.EventId = eventId;
    }

    if (workshopId) {
      dbQuery.where.WorkshopId = workshopId;
    }

    orderBy = orderBy || 'createdAt';
    orderDir = orderDir || 'ASC';

    dbQuery.order = [[orderBy, orderDir]];

    let _page = +page || 0;
    let _pageSize = +pageSize || PAGE_SIZE;

    dbQuery.offset = _page * _pageSize;
    dbQuery.limit = _pageSize;

    const rows = await UserFavorite.findAll({...dbQuery});
    const count = await UserFavorite.count(dbQuery);

    return res.status(200).jsend.success({
      userFavorites: {
        page: _page,
        pageSize: _pageSize,
        totalPages: Math.ceil(count / _pageSize),
        totalRows: count,
        rows
      }
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

