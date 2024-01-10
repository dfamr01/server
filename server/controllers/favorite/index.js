const {deleteFavorite} = require('./favorite.delete.controller');
const {findFavorite} = require('./favorite.find.controller');
const {getFavorite} = require('./favorite.get.controller');
const {getFavoriteTile} = require('./favorite.get-tile.controller');
const {getAllFavorites} = require('./favorite.get-all.controller');
const {postFavorite} = require('./favorite.post.controller');

module.exports = {
  deleteFavorite,
  findFavorite,
  getFavorite,
  getFavoriteTile,
  getAllFavorites,
  postFavorite,
};
