const express = require('express');
const router = express.Router();
const expenseController = require('../controller/expense.controller');

// Create expense
router.post('/create', expenseController.createExpense);

// Get all expenses for the authenticated user
router.get('/', expenseController.getAllExpenses);  // get all expenses with pagination (20, 30, 40)

// Get first page with 20 items (default)
// GET /api/expenses

// Get first page with 30 items
// GET /api/expenses?limit=30

// Get second page with 40 items
// GET /api/expenses?page=2&limit=40

// Get third page with 20 items
// GET /api/expenses?page=3

// Get expense statistics by month and year
router.get('/stats', expenseController.getExpenseStats);
// GET /api/expenses/stats - Current month (default)
// GET /api/expenses/stats?month=12&year=2024 - Specific month and year
// GET /api/expenses/stats?year=2024 - Specific year


router.get('/:id', expenseController.getExpenseById); // Get expense by ID

// Update expense
router.put('/:id', expenseController.updateExpense);

// Delete expense
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;