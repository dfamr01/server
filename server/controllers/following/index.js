const {deleteFollowing} = require('./following.delete.controller');
const {findFollowing} = require('./following.find.controller');
const {getFollowing} = require('./following.get.controller');
const {getFollowingTile} = require('./following.get-tile.controller');
const {getFollowingsCount} = require('./following.get-count.controller');
const {getAllFollowings} = require('./following.get-all.controller');
const {postFollowing} = require('./following.post.controller');

module.exports = {
  deleteFollowing,
  findFollowing,
  getFollowing,
  getFollowingTile,
  getAllFollowings,
  getFollowingsCount,
  postFollowing,
};
