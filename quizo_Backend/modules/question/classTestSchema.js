const mongoose = require('mongoose');

const classTestSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    testName: {
        type: String,
        required: true
    },
    questions: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
    },
    testDescription: {
        type: String,
        required: true
    },
    totalPoints: {
        type: Number,
        default: 0
    },
    timeLimit: {
        type: Number,
        default: 30
    },
    testDate: {
        type: Date,
        required: true
    },
    testDuration: {
        type: Number,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
}, { timestamps: true });

const ClassTest = mongoose.model('ClassTest', classTestSchema);

module.exports = ClassTest;