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

