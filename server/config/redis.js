const {createClient} = require('../shared/utils');

const sub = createClient();

module.exports = {
  getSub: function () {
    return sub;
  },
  getPub: function () {
    return sub.duplicate();
  }
};
