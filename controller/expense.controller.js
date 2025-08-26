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

