const Expense = require('../models/expense.model');

exports.createExpense = async (req, res) => {
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

// Get all expenses for a user with pagination
exports.getAllExpenses = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        // Validate limit to only allow 20, 30, or 40
        const validLimits = [20, 30, 40];
        const finalLimit = validLimits.includes(limit) ? limit : 20;
        
        const skip = (page - 1) * finalLimit;
        
        // Get total count for pagination info
        const totalExpenses = await Expense.countDocuments({ user: userId });
        const totalPages = Math.ceil(totalExpenses / finalLimit);
        
        const expenses = await Expense.find({ user: userId })
            .sort({ date: -1 })
            .skip(skip)
            .limit(finalLimit);
            
        res.status(200).json({ 
            message: 'Expenses retrieved successfully', 
            expenses,
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
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// Get expense by ID
exports.getExpenseById = async (req, res) => {
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
exports.updateExpense = async (req, res) => {
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
exports.deleteExpense = async (req, res) => {
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

// Get expense statistics by month and year
exports.getExpenseStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { month, year } = req.query;
        
        let startDate, endDate;
        
        if (month && year) {
            // Specific month and year
            startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
        } else if (year && !month) {
            // Specific year only
            startDate = new Date(parseInt(year), 0, 1);
            endDate = new Date(parseInt(year), 11, 31, 23, 59, 59, 999);
        } else {
            // Current month (default)
            const now = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        // Get expenses for the specified period
        const expenses = await Expense.find({
            user: userId,
            date: { $gte: startDate, $lte: endDate }
        });

        // Calculate statistics
        const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalExpenses = expenses.length;
        
        // Category breakdown
        const categoryStats = {};
        expenses.forEach(expense => {
            if (categoryStats[expense.category]) {
                categoryStats[expense.category].count++;
                categoryStats[expense.category].amount += expense.amount;
            } else {
                categoryStats[expense.category] = { count: 1, amount: expense.amount };
            }
        });

        // Payment method breakdown
        const paymentMethodStats = {};
        expenses.forEach(expense => {
            if (paymentMethodStats[expense.paymentMethod]) {
                paymentMethodStats[expense.paymentMethod].count++;
                paymentMethodStats[expense.paymentMethod].amount += expense.amount;
            } else {
                paymentMethodStats[expense.paymentMethod] = { count: 1, amount: expense.amount };
            }
        });

        // Status breakdown
        const statusStats = {};
        expenses.forEach(expense => {
            if (statusStats[expense.isDone]) {
                statusStats[expense.isDone].count++;
                statusStats[expense.isDone].amount += expense.amount;
            } else {
                statusStats[expense.isDone] = { count: 1, amount: expense.amount };
            }
        });

        // Daily breakdown for the period
        const dailyStats = {};
        expenses.forEach(expense => {
            const dateKey = expense.date.toISOString().split('T')[0];
            if (dailyStats[dateKey]) {
                dailyStats[dateKey].count++;
                dailyStats[dateKey].amount += expense.amount;
            } else {
                dailyStats[dateKey] = { count: 1, amount: expense.amount };
            }
        });

        // Convert daily stats to sorted array
        const dailyStatsArray = Object.entries(dailyStats)
            .map(([date, stats]) => ({ date, ...stats }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        res.status(200).json({
            message: 'Expense statistics retrieved successfully',
            period: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                month: startDate.getMonth() + 1,
                year: startDate.getFullYear()
            },
            summary: {
                totalAmount: parseFloat(totalAmount.toFixed(2)),
                totalExpenses,
                averageAmount: totalExpenses > 0 ? parseFloat((totalAmount / totalExpenses).toFixed(2)) : 0
            },
            categoryBreakdown: categoryStats,
            paymentMethodBreakdown: paymentMethodStats,
            statusBreakdown: statusStats,
            dailyBreakdown: dailyStatsArray
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

