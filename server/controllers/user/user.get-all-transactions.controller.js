const logger = require('../../config/log4js')('user-get-all-transactions');
const {PAGE_SIZE, TRANSACTION_STATUS} = require('../../shared/config/constants');
const Transaction = require('../../shared/database/models/transaction.model');
const Workshop = require('../../shared/database/models/workshop.model');
const Event = require('../../shared/database/models/event.model');
const Occurrence = require('../../shared/database/models/occurrence.model');

exports.getAllTransactions = async function (req, res, next) {
  try {
    const {query, user} = req;
    let {orderBy, orderDir, page, pageSize, offset, limit, imBuyer} = query;

    const status = imBuyer ? {status: [TRANSACTION_STATUS.STARTED.key, TRANSACTION_STATUS.SUCCEEDED.key]} : {status: TRANSACTION_STATUS.FULFILLED.key};
    const belongsTo = imBuyer ? 'buyerId' : 'sellerId';
    const include = imBuyer
      ? {}
      :
      {
        include: [
          {
            model: Workshop,
            attributes: ['id', 'title']
          },
          {
            model: Event,
            attributes: ['id', 'title']
          },
          {
            model: Occurrence,
            attributes: ['id', 'date']
          }
        ]
      }

    const dbQuery = {
      where: {
        [belongsTo]: user.id,
        ...status
      },
      ...include
    };

    orderBy = orderBy || 'createdAt';
    orderDir = orderDir || 'ASC';

    dbQuery.order = [[orderBy, orderDir]];

    let _page = +page || 0;
    let _pageSize = +pageSize || PAGE_SIZE;

    let _offset = +offset >= 0 ? +offset : _page * _pageSize;
    let _limit = +limit >= 0 ? +limit : _pageSize;

    dbQuery.offset = _offset;
    dbQuery.limit = _limit;

    const rows = await Transaction.findAll(dbQuery);
    // const count = await Transaction.count(dbQuery);
    const count = rows.length || 0;
    return res.status(200).jsend.success({
      transactions: {
        page: _page,
        pageSize: _pageSize,
        totalPages: Math.ceil(count / _pageSize),
        totalRows: count,
        rows,
      }
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

