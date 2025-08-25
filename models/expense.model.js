const mongoose = require('mongoose'); 

const expenseSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    date: {
        type: Date,
        required: false,
        default: new Date()
    },
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        enum: ['food', 'transport','fuel', 'entertainment', 'shopping', 'bills', 'bikeservice' , 'other'],
        default: 'other',
        required: true
    },
    description: {
        type: String,
        required: false,
        default: 'NA'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'upi', 'phonepe', 'naviupi','netbanking','debitcard','googlepay','other'],
        default: 'cash'
    },
    receipt: {
        type: String,
        required: false,
        default: 'NA'
    },
    isDone: {
        type: String,
        enum: ['completed', 'pending'],
        default: 'pending'
    },


});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;