const {find} = require('./workshop.find.controller');
const {get} = require('./workshop.get.controller');
const {getContainer} = require('./workshop.get-container.controller');
const {getEager} = require('./workshop.get-eager.controller');
const {getAll} = require('./workshop.get-all.controller');
const {getAllUpcoming} = require('./workshop.get-all-upcoming.controller');

const {post} = require('./workshop.post.controller');
const {start} = require('./workshop.start.controller');
const {complete} = require('./workshop.complete.controller');
const {update} = require('./workshop.update.controller');
const {updatePrivacy} = require('./workshop.update-privacy.controller');
const {updateVisibility} = require('./workshop.update-visibility.controller');
const {workshopDelete} = require('./workshop.delete.controller');

const {getRating} = require('./workshop.get-rating.controller');

const {getSettings} = require('./workshop.get-settings.controller');
const {updateSettings} = require('./workshop.update-settings.controller');

const {findRegistration} = require('./workshop.find-registration.controller');
const {getRegistration} = require('./workshop.get-registration.controller');
const {getAllRegistration} = require('./workshop.get-all-registration.controller');
const {postRegistration} = require('./workshop.post-registration.controller');
const {deleteRegistration} = require('./workshop.delete-registration.controller');

const {updateCoverPhoto} = require('./workshop.update-cover-photo.controller');
const {workshopRequireActive} = require('./workshop.require-active.controller');

module.exports = {
  find,
  get,
  getContainer,
  getEager,
  getAll,
  getAllUpcoming,

  post,
  start,
  complete,
  update,
  updatePrivacy,
  updateVisibility,
  workshopDelete,

  getRating,

  getSettings,
  updateSettings,

  findRegistration,
  getRegistration,
  getAllRegistration,
  postRegistration,
  deleteRegistration,

  updateCoverPhoto,
  workshopRequireActive
};
