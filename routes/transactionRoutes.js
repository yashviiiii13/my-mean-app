const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createTransaction,
  getTransactions,
  deleteTransaction,
  updateTransaction,
} = require('../controllers/transactionController');

router.use(auth);

router.post('/', createTransaction);
router.get('/', getTransactions);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
