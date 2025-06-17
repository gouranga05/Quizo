const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    lastDate: { type: Date },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['todo', 'in-progress', 'completed'], default: 'todo' },
    labels: [{ type: String }]
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;