const mongoose = require('mongoose');

const notesSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sharedWith: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        permission: { type: String, enum: ['view', 'edit'], default: 'view' }
    }],
    isPublic: { type: Boolean, default: false },
    tags: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }
}, { timestamps: true });

const Notes = mongoose.model('Notes', notesSchema);

module.exports = Notes;