const logger = require('../../config/log4js')('following-get-all-ctrl');
const {PAGE_SIZE} = require('../../shared/config/constants');
const UserFollowing = require('../../shared/database/models/userFollowing.model');

exports.getAllFollowings = async function (req, res, next) {
  try {
    const {user, query} = req;
    let {orderBy, orderDir, page, pageSize, channelId} = query;

    const dbQuery = {
      where: {
        UserId: user.id
      },
    };

    if (channelId) {
      dbQuery.where.toUserId = channelId;
    }

    orderBy = orderBy || 'createdAt';
    orderDir = orderDir || 'ASC';

    dbQuery.order = [[orderBy, orderDir]];

    let _page = +page || 0;
    let _pageSize = +pageSize || PAGE_SIZE;

    dbQuery.offset = _page * _pageSize;
    dbQuery.limit = _pageSize;

    const rows = await UserFollowing.findAll({...dbQuery});
    const count = await UserFollowing.count(query);

    return res.status(200).jsend.success({
      userFollowings: {
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

