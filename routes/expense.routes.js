import express from 'express';
const router = express.Router();
import * as expenseController from '../controller/expense.controller.js';
import { authToken, requireUser } from "../Middleware/Auth.js";

// All routes require authentication
// router.use(authToken);
// router.use(requireUser);

// Create expense
router.post('/create', expenseController.createExpense);

// Get all expenses for the authenticated user
router.get('/', expenseController.getAllExpenses);

router.get('/:id', expenseController.getExpenseById); // Get expense by ID

// Update expense
router.put('/:id', expenseController.updateExpense);

// Delete expense
router.delete('/:id', expenseController.deleteExpense);

export default router;