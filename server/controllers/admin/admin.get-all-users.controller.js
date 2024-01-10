const logger = require('../../config/log4js')('admin-get-all-users');
const {PAGE_SIZE} = require('../../shared/config/constants');
const {getUserFullName} = require('../../shared/utils');
const User = require('../../shared/database/models/user.model');

exports.getAllUsers = async function (req, res, next) {
  try {
    const {query} = req;
    let {orderBy, orderDir, page, pageSize} = query;

    // todo: make sure not to select admin users.
    // todo: add isAdmin to user module to make this simpler but still continue using the permission system
    const dbQuery = {
      where: {},
      include: User.includesForEmail
    };

    orderBy = orderBy || 'createdAt';
    orderDir = orderDir || 'ASC';

    dbQuery.order = [[orderBy, orderDir]];

    let _page = +page || 0;
    let _pageSize = +pageSize || PAGE_SIZE;

    dbQuery.offset = _page * _pageSize;
    dbQuery.limit = _pageSize;

    const rows = await User.findAll({...dbQuery});
    const count = await User.count(dbQuery);

    return res.status(200).jsend.success({
      users: {
        page: _page,
        pageSize: _pageSize,
        totalPages: Math.ceil(count / _pageSize),
        totalRows: count,
        rows: (rows || []).map((user) => {
          return {
            ...user.filterFieldsFor({key: 'get'}),
            avatar: user.UserProfile.avatar,
            fullName: getUserFullName(user.UserProfile)
          };
        })
      }
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

