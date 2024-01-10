const express = require('express');
//  const logger = require('../config/log4js')('auth router');

const {requireLogin, requireActive} = require('../controllers/authentication');
const {
  deleteFollowing,
  findFollowing,
  getFollowing,
  getFollowingTile,
  getAllFollowings,
  getFollowingsCount,
  postFollowing,
} = require('../controllers/following');

module.exports = function (apiRouter) {
  const userRouter = express.Router();

  // Path: /user
  apiRouter.use('/following', userRouter);

  userRouter.all('*', requireLogin, requireActive);

  // following
  // Path: /following
  // ==================================================
  userRouter.route('/')
    .post(postFollowing);

  // following
  // Path: /following/all
  // ==================================================
  userRouter.route('/all')
    .get(getAllFollowings);

  // following
  // Path: /following/count
  // ==================================================
  userRouter.route('/count')
    .get(getFollowingsCount);

  // following
  // Path: /following/tile
  // ==================================================
  userRouter.route('/tile')
    .get(getFollowingTile);

  // following
  // Path: /following/:followingId
  // ==================================================
  userRouter.route('/:followingId')
    .get(getFollowing)
    .delete(deleteFollowing);


  userRouter.param('followingId', findFollowing);
};
