import Expense from '../models/expense.model.js';
import mongoose from 'mongoose';

export const createExpense = async (req, res) => {
    try {
        const { date, amount, category, description, paymentMethod, receipt, isDone } = req.body;
        const userId = req.user.id;

        const expense = await Expense.create({ user: userId, date, amount, category, description, paymentMethod, receipt, isDone });
        res.status(201).json({ message: 'Expense created successfully', expense });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// Get all expenses for a user with pagination and statistics
export const getAllExpenses = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        // Validate limit to only allow 20, 30, or 40
        const validLimits = [20, 30, 40];
        const finalLimit = validLimits.includes(limit) ? limit : 20;

        const skip = (page - 1) * finalLimit;

        // Get date range for current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Run queries in parallel for efficiency
        const [totalExpenses, expenses, monthStats, statusStats] = await Promise.all([
            Expense.countDocuments({ user: userId }),
            Expense.find({ user: userId })
                .sort({ date: -1 })
                .skip(skip)
                .limit(finalLimit),
            // Monthly stats
            Expense.aggregate([
                { $match: { user: new mongoose.Types.ObjectId(userId), date: { $gte: startOfMonth, $lte: endOfMonth } } },
                {
                    $group: {
                        _id: null,
                        totalCount: { $sum: 1 },
                        totalAmount: { $sum: "$amount" }
                    }
                }
            ]),
            // Overall status stats
            Expense.aggregate([
                { $match: { user: new mongoose.Types.ObjectId(userId) } },
                {
                    $group: {
                        _id: "$isDone",
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        const totalPages = Math.ceil(totalExpenses / finalLimit);

        // Process status stats
        const statusCounts = { completed: 0, pending: 0 };
        statusStats.forEach(stat => {
            if (stat._id === 'completed') statusCounts.completed = stat.count;
            if (stat._id === 'pending') statusCounts.pending = stat.count;
        });

        res.status(200).json({
            message: 'Expenses retrieved successfully',
            expenses,
            statistics: {
                currentMonth: {
                    totalExpenses: monthStats[0]?.totalCount || 0,
                    totalAmount: parseFloat((monthStats[0]?.totalAmount || 0).toFixed(2))
                },
                overall: {
                    totalCompleted: statusCounts.completed,
                    totalPending: statusCounts.pending
                }
            },
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalExpenses: totalExpenses,
                limit: finalLimit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    }
    catch (error) {
        console.error("Get all expenses error:", error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// Get expense by ID
export const getExpenseById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const expense = await Expense.findOne({ _id: id, user: userId });

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.status(200).json({ message: 'Expense retrieved successfully', expense });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// Update expense
export const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, amount, category, description, paymentMethod, receipt, isDone } = req.body;
        const userId = req.user.id;

        const expense = await Expense.findOneAndUpdate(
            { _id: id, user: userId },
            { date, amount, category, description, paymentMethod, receipt, isDone },
            { new: true, runValidators: true }
        );

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.status(200).json({ message: 'Expense updated successfully', expense });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// Delete expense
export const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const expense = await Expense.findOneAndDelete({ _id: id, user: userId });

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.status(200).json({ message: 'Expense deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}


