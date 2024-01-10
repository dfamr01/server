const {find} = require('./event.find.controller');
const {get} = require('./event.get.controller');
const {getEager} = require('./event.get-eager.controller');
const {getContainer} = require('./event.get-container.controller');
const {getAll} = require('./event.get-all.controller');
const {getAllUpcoming} = require('./event.get-all-upcoming.controller');

const {post} = require('./event.post.controller');
const {start} = require('./event.start.controller');
const {complete} = require('./event.complete.controller');
const {update} = require('./event.update.controller');
const {updatePrivacy} = require('./event.update-privacy.controller');
const {updateVisibility} = require('./event.update-visibility.controller');
const {eventDelete} = require('./event.delete.controller');

const {getRating} = require('./event.get-rating.controller');

const {getSettings} = require('./event.get-settings.controller');
const {updateSettings} = require('./event.update-settings.controller');

const {getOccurrences} = require("./event.get-occurrences.controller");

const {getOccurrence} = require('./event.get-occurrence.controller');
const {postOccurrence} = require('./event.post-occurrence.controller');
const {updateOccurrence} = require('./event.update-occurrence.controller');
const {deleteOccurrence} = require('./event.delete-occurrence.controller');

const {findRegistration} = require('./event.find-registration.controller');
const {getRegistration} = require('./event.get-registration.controller');
const {getAllRegistration} = require('./event.get-all-registration.controller');
const {postRegistration} = require('./event.post-registration.controller');
const {deleteRegistration} = require('./event.delete-registration.controller');

const {updateCoverPhoto} = require('./event.update-cover-photo.controller');

const {eventRequireActive} = require('./event.require-active.controller');

module.exports = {
  find,
  get,
  getEager,
  getContainer,
  getAll,
  getAllUpcoming,
  post,
  start,
  complete,
  update,
  updatePrivacy,
  updateVisibility,
  eventDelete,

  getRating,

  getSettings,
  updateSettings,

  getOccurrences,

  getOccurrence,
  postOccurrence,
  updateOccurrence,
  deleteOccurrence,

  findRegistration,
  getRegistration,
  getAllRegistration,
  postRegistration,
  deleteRegistration,

  updateCoverPhoto,

  eventRequireActive,
};
