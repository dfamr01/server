const express = require('express');
//  const logger = require('../config/log4js')('auth router');

const {requireLogin, requireActive} = require('../controllers/authentication');
const {
  deleteFavorite,
  findFavorite,
  getFavorite,
  getFavoriteTile,
  getAllFavorites,
  postFavorite,
} = require('../controllers/favorite');

module.exports = function (apiRouter) {
  const userRouter = express.Router();

  // Path: /user
  apiRouter.use('/favorite', userRouter);

  userRouter.all('*', requireLogin, requireActive);

  // favorite
  // Path: /favorite
  // ==================================================
  userRouter.route('/')
    .post(postFavorite);

  // favorite
  // Path: /favorite
  // ==================================================
  userRouter.route('/all')
    .get(getAllFavorites);

  // favorite
  // Path: /favorite/tile
  // ==================================================
  userRouter.route('/tile')
    .get(getFavoriteTile);

  // favorite
  // Path: /favorite/:favoriteId
  // ==================================================
  userRouter.route('/:favoriteId')
    .get(getFavorite)
    .delete(deleteFavorite);


  userRouter.param('favoriteId', findFavorite);
};
