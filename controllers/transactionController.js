const Transaction = require('../models/Transaction');

// POST /api/transactions
exports.createTransaction = async (req, res) => {
  try {
    const { type, description, amount, date } = req.body;

    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'Type must be income or expense' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Description is required' });
    }
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    const transaction = await Transaction.create({
      user: req.user.id,
      type,
      description: description.trim(),
      amount: numAmount,
      date: date ? new Date(date) : new Date(),
    });

    res.status(201).json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while creating transaction' });
  }
};

// GET /api/transactions?type=&dateFrom=&dateTo=&amountMin=&amountMax=&sortBy=&sortOrder=&page=&limit=
exports.getTransactions = async (req, res) => {
  try {
    const {
      type,
      dateFrom,
      dateTo,
      amountMin,
      amountMax,
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const query = { user: req.user.id };

    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (amountMin || amountMax) {
      query.amount = {};
      if (amountMin) query.amount.$gte = Number(amountMin);
      if (amountMax) query.amount.$lte = Number(amountMax);
    }

    const allowedSortFields = ['date', 'amount', 'type'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'date';
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total, summary] = await Promise.all([
      Transaction.find(query)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(query),
      Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const totals = { income: 0, expense: 0 };
    summary.forEach((s) => {
      totals[s._id] = s.total;
    });

    res.status(200).json({
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
      totals: {
        income: totals.income,
        expense: totals.expense,
        balance: totals.income - totals.expense,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching transactions' });
  }
};

// DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.status(200).json({ message: 'Transaction deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while deleting transaction' });
  }
};

// PUT /api/transactions/:id
exports.updateTransaction = async (req, res) => {
  try {
    const { type, description, amount, date } = req.body;
    const update = {};
    if (type) update.type = type;
    if (description) update.description = description.trim();
    if (amount) update.amount = Number(amount);
    if (date) update.date = new Date(date);

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      update,
      { new: true, runValidators: true }
    );
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.status(200).json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating transaction' });
  }
};
