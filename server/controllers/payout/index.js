const {find} = require('./payout.find.controller');
const {payoutGenerate} = require('./payout.generate.controller');
const {payoutGet} = require('./payout.get.controller');
const {payoutGetAll} = require('./payout.get-all.controller');
const {payoutRequestTransfer} = require('./payout.request-transfer.controller');


module.exports = {
  find,
  payoutGenerate,
  payoutGet,
  payoutGetAll,
  payoutRequestTransfer
};
