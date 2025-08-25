const express = require('express');
const router = express.Router();
const expenseController = require('../controller/expense.controller');

router.post('/create', expenseController.createExpense);

module.exports = router;