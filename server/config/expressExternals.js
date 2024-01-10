const express = require('express');
const Event = require('../shared/database/models/event.model');
const Workshop = require('../shared/database/models/workshop.model');
const {TWITTER_ID, FB_APP_ID} = require('../shared/config/constants');

module.exports = (app) => {
  const userRouter = express.Router();

  // Path: /social-media
  app.use('/social-media', userRouter);

  // EJS
  // ==================================================
  app.set('views', './server/views');
  app.set('view engine', 'ejs');

  // temp solution for social media share dialog.
  // a quick links route - need to move this to move to a better solution.
  userRouter.get('/quick-links', async (req, res, next) => {
    try {
      const {redirectTo, EventId, WorkshopId} = req.query;
      let content;
      if (EventId) {
        content = await Event.findByPk(EventId);
      } else {
        content = await Workshop.findByPk(WorkshopId);
      }

      const options = {
        redirectTo: decodeURIComponent(redirectTo),
        title: content.title,
        coverPhoto: content.coverPhotoHomePage,
        summary: content.summary,
        FB_APP_ID,
        TWITTER_ID,
      };

      return res.render('quickLinks', options);
    } catch (err) {
      return res.status(500).jsend.fail(err);
    }
  });

  return app;
};
