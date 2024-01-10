const {accountCheck} = require('./stripe.account-check.controller');
const {accountCreate} = require('./stripe.account-create.controller');
const {accountCreateLink} = require('./stripe.account-create-link.controller');

const {hooksConnect} = require('./stripe.hooks-connect.controller');
const {hooksPayments} = require('./stripe.hooks-payments.controller');

const {paymentCreateIntent} = require('./stripe.payment-create-intent.controller');
const {paymentDeleteMethod} = require('./stripe.payment-delete-method.controller');
const {transactionFailed} = require('./stripe.payment-transaction-failed.controller');
const {paymentListMethods} = require('./stripe.payment-list-methods.controller');
const {paymentNewCharge} = require('./stripe.payment-new-charge.controller');
const {paymentUpdateDpm} = require('./stripe.payment-update-dpm.controller');
const {getDashboardLink} = require('./stripe.get-dashboard-link.controller');
const {can} = require('./stripe.get-dashboard-link.controller');
const {refundContent} = require("./stripe.post-refund-content.controller");
const {findTransaction} = require("./stripe.find-transaction.controller");
const {canCreateRefund} = require("../../shared/permissions/middleware/stripe");

module.exports = {
  accountCheck,
  accountCreate,
  accountCreateLink,
  hooksConnect,
  hooksPayments,
  paymentCreateIntent,
  paymentDeleteMethod,
  transactionFailed,
  paymentListMethods,
  paymentNewCharge,
  paymentUpdateDpm,
  getDashboardLink,
  refundContent,
  findTransaction,
  canCreateRefund,
};
