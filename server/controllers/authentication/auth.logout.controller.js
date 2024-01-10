exports.logout = function (req, res, next) {
  req.logout();
  res.jsend.success();
};
