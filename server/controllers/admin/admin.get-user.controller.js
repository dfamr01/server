const {getUserFullName} = require("../../shared/utils");
const logger = require('../../config/log4js')('admin-get-user');

exports.getUser = function (req, res, next) {
  try {
    const {foundUser} = req;
    const filtered = foundUser.filterFieldsFor({key: 'get', rootOnly: true});
    filtered.fullName = getUserFullName(foundUser.UserProfile);

    return res.status(200).jsend.success({
      user: filtered
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

