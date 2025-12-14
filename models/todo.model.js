import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    category: {
        type: String,
        enum: ['work', 'personal', 'shopping', 'health', 'other'],
        default: 'other'
    },
    dueDate: {
        type: Date
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    attachments: {
        type: [String]
    },
    completed: {
        type: Boolean,
        default: false
    },
    ip: {
        type: String
    },
    userAgent: {
        type: String
    }

}, { timestamps: true });

const Todo = mongoose.model('Todo', todoSchema);

export default Todo;


